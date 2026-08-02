import type { Task, Reminder, Settings } from "@/types";
import { taskRepository, reminderRepository } from "@/repositories/indexeddb";
import { SETTINGS_KEY } from "@/stores/appStore";

// A Barely backup is a plain JSON snapshot of everything stored on the device:
// all tasks, the reminder, and the settings. No account, no server - the user
// owns the file.

const BACKUP_APP = "barely";
const BACKUP_VERSION = 1;

export interface BackupData {
  app: string;
  version: number;
  exportedAt: string;
  settings: Settings | null;
  reminder: Reminder | null;
  tasks: Task[];
}

// ── Export ────────────────────────────────────────────────────────────

/** Gather everything the user has stored on this device. */
export async function buildBackup(): Promise<BackupData> {
  const tasks = await taskRepository.getAll();
  const reminder = (await reminderRepository.get()) ?? null;
  let settings: Settings | null = null;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) settings = JSON.parse(raw) as Settings;
  } catch {
    settings = null;
  }
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    reminder,
    tasks,
  };
}

/** Build a backup and trigger a download of it as a JSON file. */
export async function exportBackup(): Promise<void> {
  const data = await buildBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `barely-backup-${data.exportedAt.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Import ────────────────────────────────────────────────────────────

function isTask(x: unknown): x is Task {
  if (typeof x !== "object" || x === null) return false;
  const t = x as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.date === "string" &&
    (t.section === "work" || t.section === "personal") &&
    typeof t.text === "string" &&
    typeof t.done === "boolean" &&
    typeof t.carried === "boolean" &&
    typeof t.createdAt === "number"
  );
}

/** Parse and validate backup JSON. Throws a user-friendly Error on bad input. */
export function parseBackup(text: string): BackupData {
  let obj: unknown;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (typeof obj !== "object" || obj === null) {
    throw new Error("That doesn't look like a Barely backup.");
  }
  const o = obj as Record<string, unknown>;
  if (o.app !== BACKUP_APP) throw new Error("That doesn't look like a Barely backup.");
  if (!Array.isArray(o.tasks)) throw new Error("This backup is missing its tasks.");

  const tasks = (o.tasks as unknown[]).filter(isTask);
  return {
    app: BACKUP_APP,
    version: typeof o.version === "number" ? o.version : 1,
    exportedAt: typeof o.exportedAt === "string" ? o.exportedAt : new Date().toISOString(),
    settings: (o.settings as Settings) ?? null,
    reminder: (o.reminder as Reminder) ?? null,
    tasks,
  };
}

/**
 * Restore a parsed backup. Tasks are merged by id (upsert), so importing on a
 * fresh device restores everything and importing on an existing one never
 * deletes current data. Settings + reminder are overwritten from the backup.
 */
export async function restoreBackup(data: BackupData): Promise<{ tasks: number }> {
  if (data.tasks.length) await taskRepository.saveMany(data.tasks);
  if (data.reminder) await reminderRepository.save(data.reminder);
  if (data.settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
    } catch {
      /* ignore - settings are non-critical */
    }
  }
  return { tasks: data.tasks.length };
}

/** Read a chosen File, validate, and restore it. Returns how many tasks landed. */
export async function importBackupFromFile(file: File): Promise<{ tasks: number }> {
  const text = await file.text();
  return restoreBackup(parseBackup(text));
}
