import type { Task } from "@/types";
import type { BackupData } from "@/utils/backup";
import { buildBackup, restoreBackup } from "@/utils/backup";
import { useTaskStore } from "@/stores/taskStore";
import { useAppStore } from "@/stores/appStore";

// ── Sync provider abstraction ─────────────────────────────────────────
// A provider is just a place to stash and fetch one snapshot blob (Google
// Drive, a passphrase-keyed KV, ...). The engine below is provider-agnostic:
// it merges whatever a provider returns with the local data and pushes the
// result back.

export interface SyncProvider {
  readonly id: string; // e.g. "gdrive" | "passphrase"
  readonly label: string;
  /** Fetch the stored snapshot, or null if nothing is stored yet. */
  pull(): Promise<BackupData | null>;
  /** Store the snapshot. */
  push(data: BackupData): Promise<void>;
}

const stamp = (t: Task): number => t.updatedAt ?? t.createdAt ?? 0;

/** Merge two task lists by id; the newest `updatedAt` wins (tombstones included). */
export function mergeTasks(local: Task[], remote: Task[]): Task[] {
  const byId = new Map<string, Task>();
  for (const t of local) byId.set(t.id, t);
  for (const t of remote) {
    const current = byId.get(t.id);
    if (!current || stamp(t) >= stamp(current)) byId.set(t.id, t);
  }
  return [...byId.values()];
}

/**
 * Merge two full snapshots. Tasks merge per-id by newest write; settings and
 * reminder are kept from the local device when it has them (so syncing never
 * clobbers this device's preferences), falling back to the remote's for a
 * brand-new device that has none yet.
 */
export function mergeBackups(local: BackupData, remote: BackupData): BackupData {
  return {
    app: "barely",
    version: Math.max(local.version || 1, remote.version || 1),
    exportedAt: new Date().toISOString(),
    settings: local.settings ?? remote.settings ?? null,
    reminder: local.reminder ?? remote.reminder ?? null,
    tasks: mergeTasks(local.tasks, remote.tasks),
  };
}

export interface SyncResult {
  pulled: boolean; // was there a remote snapshot?
  tasks: number; // active (non-deleted) task count after merge
}

/**
 * One sync pass with a provider: pull -> merge -> write locally -> push. Safe
 * to call repeatedly; it converges. After applying, today's view is refreshed.
 */
export async function runSync(provider: SyncProvider): Promise<SyncResult> {
  const local = await buildBackup();
  const remote = await provider.pull();
  const merged = remote ? mergeBackups(local, remote) : local;

  // Persist the merged snapshot locally (upserts tasks incl. tombstones,
  // restores settings/reminder) and push it back to the provider.
  await restoreBackup(merged);
  await provider.push(merged);

  // Refresh the in-memory view so merged tasks show without a reload.
  const { carryEnabled } = useAppStore.getState().settings;
  await useTaskStore.getState().init(carryEnabled);

  return { pulled: !!remote, tasks: merged.tasks.filter((t) => !t.deleted).length };
}
