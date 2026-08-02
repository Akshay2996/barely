import { openDB, type IDBPDatabase } from "idb";
import type { Task, Reminder } from "@/types";
import type { ITaskRepository, IReminderRepository } from "./interfaces";

// ── Schema ────────────────────────────────────────────────────────────

interface BarelySchema {
  tasks: { key: string; value: Task; indexes: { "by-date": string } };
  reminders: { key: string; value: Reminder };
}

const DB_NAME = "barely";
const DB_VERSION = 2;
// If the DB can't open within this window (blocked by another tab mid-upgrade,
// private-mode restrictions, or a wedged store) we stop waiting and fall back
// to in-memory storage so the app never hangs.
const OPEN_TIMEOUT_MS = 4000;

const byCreated = (a: Task, b: Task) => a.createdAt - b.createdAt;

// ── Storage backend abstraction ───────────────────────────────────────
// Either a real IndexedDB connection or an in-memory stand-in. Both satisfy
// the same shape so the repositories don't care which one they got.

interface Backend {
  readonly persistent: boolean;
  getAll(): Promise<Task[]>;
  getByDate(date: string): Promise<Task[]>;
  getInRange(start: string, end: string): Promise<Task[]>;
  save(task: Task): Promise<void>;
  saveMany(tasks: Task[]): Promise<void>;
  update(id: string, updates: Partial<Omit<Task, "id">>): Promise<void>;
  remove(id: string): Promise<void>;
  reminderGet(): Promise<Reminder | undefined>;
  reminderSave(reminder: Reminder): Promise<void>;
}

function createIdbBackend(db: IDBPDatabase<BarelySchema>): Backend {
  return {
    persistent: true,
    async getAll() {
      return (await db.getAll("tasks")).sort(byCreated);
    },
    async getByDate(date) {
      return (await db.getAllFromIndex("tasks", "by-date", date)).sort(byCreated);
    },
    async getInRange(start, end) {
      return (await db.getAllFromIndex("tasks", "by-date", IDBKeyRange.bound(start, end))).sort(
        byCreated,
      );
    },
    async save(task) {
      await db.put("tasks", task);
    },
    async saveMany(tasks) {
      const tx = db.transaction("tasks", "readwrite");
      await Promise.all([...tasks.map((t) => tx.store.put(t)), tx.done]);
    },
    async update(id, updates) {
      const existing = await db.get("tasks", id);
      if (existing) await db.put("tasks", { ...existing, ...updates });
    },
    async remove(id) {
      await db.delete("tasks", id);
    },
    async reminderGet() {
      return db.get("reminders", "main");
    },
    async reminderSave(reminder) {
      await db.put("reminders", reminder);
    },
  };
}

// In-memory fallback: keeps the app fully functional for the session even when
// IndexedDB is unavailable. Data simply doesn't survive a reload.
function createMemoryBackend(): Backend {
  const tasks = new Map<string, Task>();
  let reminder: Reminder | undefined;
  return {
    persistent: false,
    async getAll() {
      return [...tasks.values()].sort(byCreated);
    },
    async getByDate(date) {
      return [...tasks.values()].filter((t) => t.date === date).sort(byCreated);
    },
    async getInRange(start, end) {
      return [...tasks.values()].filter((t) => t.date >= start && t.date <= end).sort(byCreated);
    },
    async save(task) {
      tasks.set(task.id, task);
    },
    async saveMany(list) {
      for (const t of list) tasks.set(t.id, t);
    },
    async update(id, updates) {
      const existing = tasks.get(id);
      if (existing) tasks.set(id, { ...existing, ...updates });
    },
    async remove(id) {
      tasks.delete(id);
    },
    async reminderGet() {
      return reminder;
    },
    async reminderSave(r) {
      reminder = r;
    },
  };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("indexeddb open timed out")), ms),
    ),
  ]);
}

let _backend: Promise<Backend> | null = null;

function getBackend(): Promise<Backend> {
  if (!_backend) {
    _backend = withTimeout(
      openDB<BarelySchema>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
          // Fresh install or pre-v2 database. The old v1 task shape
          // (type/completed) is incompatible with v2 (section/done) and there's
          // nothing worth keeping, so (re)create the stores. This branch runs
          // ONLY for new installs and pre-v2 DBs - existing v2 users never hit
          // it, so their data is preserved.
          if (oldVersion < 2) {
            if (db.objectStoreNames.contains("tasks")) db.deleteObjectStore("tasks");
            const tasks = db.createObjectStore("tasks", { keyPath: "id" });
            tasks.createIndex("by-date", "date");
            if (!db.objectStoreNames.contains("reminders")) {
              db.createObjectStore("reminders", { keyPath: "id" });
            }
          }

          // Future schema changes MUST be non-destructive so nobody loses data.
          // Bump DB_VERSION and add a guarded migration here, e.g.:
          //   if (oldVersion < 3) {
          //     // add an index / backfill a field - never deleteObjectStore("tasks")
          //   }
        },
        blocked() {
          // Another tab is holding an older version open, blocking our upgrade.
          console.warn("[barely] IndexedDB upgrade blocked by another tab.");
        },
        blocking() {
          // A newer version wants to open; drop our connection so it can proceed.
          _db?.close();
          _db = null;
          _backend = null;
        },
        terminated() {
          _db = null;
          _backend = null;
        },
      }),
      OPEN_TIMEOUT_MS,
    )
      .then((db) => {
        _db = db;
        return createIdbBackend(db);
      })
      .catch((err) => {
        console.warn(
          "[barely] IndexedDB unavailable - using in-memory storage for this session.",
          err,
        );
        return createMemoryBackend();
      });
  }
  return _backend;
}

// Live reference to the open connection (for blocking/terminated handling).
let _db: IDBPDatabase<BarelySchema> | null = null;

/** True once storage has resolved to a durable (IndexedDB) backend. */
export async function storageIsPersistent(): Promise<boolean> {
  return (await getBackend()).persistent;
}

// ── Task Repository ───────────────────────────────────────────────────

export class TaskRepository implements ITaskRepository {
  async getAll(): Promise<Task[]> {
    return (await getBackend()).getAll();
  }
  async getByDate(date: string): Promise<Task[]> {
    return (await getBackend()).getByDate(date);
  }
  async getInRange(startDate: string, endDate: string): Promise<Task[]> {
    return (await getBackend()).getInRange(startDate, endDate);
  }
  async save(task: Task): Promise<void> {
    return (await getBackend()).save(task);
  }
  async saveMany(tasks: Task[]): Promise<void> {
    return (await getBackend()).saveMany(tasks);
  }
  async update(id: string, updates: Partial<Omit<Task, "id">>): Promise<void> {
    return (await getBackend()).update(id, updates);
  }
  async remove(id: string): Promise<void> {
    return (await getBackend()).remove(id);
  }
}

// ── Reminder Repository ───────────────────────────────────────────────

export class ReminderRepository implements IReminderRepository {
  async get(): Promise<Reminder | undefined> {
    return (await getBackend()).reminderGet();
  }
  async save(reminder: Reminder): Promise<void> {
    return (await getBackend()).reminderSave(reminder);
  }
}

// ── Singletons (app-wide instances) ──────────────────────────────────

export const taskRepository = new TaskRepository();
export const reminderRepository = new ReminderRepository();
