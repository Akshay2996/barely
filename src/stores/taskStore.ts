import { create } from "zustand";
import type { Task, Section } from "@/types";
import type { ITaskRepository } from "@/repositories/interfaces";
import { taskRepository } from "@/repositories/indexeddb";
import { today, addDays } from "@/utils/date";
import { generateSeedHistory, SEED_MONTHS_BACK } from "@/utils/history";

// ── Demo / test data (opt-in) ─────────────────────────────────────────
// Real users start with an empty calendar. For demos or testing, sample
// history can be seeded into IndexedDB. It is OFF by default and never runs in
// normal use, so the deployed app stays clean.
//
//   Enable : open the app with `?demo=1` (or localStorage["barely:demo"]="1"),
//            then reload -> a few months of sample tasks are generated.
//   Disable: open with `?demo=0` -> the flag + sample data are removed on the
//            next load.
const DEMO_FLAG = "barely:demo"; // set = seed sample data
const SEED_FLAG = "barely:seeded:v2"; // guard so we only seed once
const PURGE_FLAG = "barely:seed-purged"; // guard so we only clean up once

/** Whether demo/sample history is enabled (URL `?demo=` overrides the stored flag). */
function demoEnabled(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const param =
      typeof location !== "undefined" && new URLSearchParams(location.search).get("demo");
    if (param === "1") {
      localStorage.setItem(DEMO_FLAG, "1");
      // Clear the guards so demo data (re)seeds even if a stale flag remains.
      localStorage.removeItem(SEED_FLAG);
      localStorage.removeItem(PURGE_FLAG);
    }
    if (param === "0") {
      // Turn demo off and let the next purge remove the sample rows.
      localStorage.removeItem(DEMO_FLAG);
      localStorage.removeItem(SEED_FLAG);
      localStorage.removeItem(PURGE_FLAG);
    }
    return localStorage.getItem(DEMO_FLAG) === "1";
  } catch {
    return false;
  }
}

/** Seed a deterministic stretch of sample history once (demo mode only). */
async function seedHistory(repo: ITaskRepository, date: string): Promise<void> {
  try {
    if (localStorage.getItem(SEED_FLAG)) return;
    const tasks = generateSeedHistory(new Date(date + "T00:00:00"), SEED_MONTHS_BACK);
    if (tasks.length) await repo.saveMany(tasks);
    localStorage.setItem(SEED_FLAG, "1");
  } catch {
    /* storage unavailable - ignore */
  }
}

// One-time cleanup of any sample/seed history (ids prefixed "seed-"). Real
// tasks use crypto.randomUUID(), so this only ever removes mock data and never
// touches the user's own entries.
async function purgeLegacySeed(repo: ITaskRepository, date: string): Promise<void> {
  try {
    if (typeof localStorage === "undefined" || localStorage.getItem(PURGE_FLAG)) return;
    const all = await repo.getInRange("2020-01-01", date);
    const seeds = all.filter((t) => t.id.startsWith("seed-"));
    if (seeds.length) await Promise.all(seeds.map((t) => repo.remove(t.id)));
    localStorage.setItem(PURGE_FLAG, "1");
  } catch {
    /* non-critical cleanup - ignore */
  }
}

interface CarryPending {
  text: string;
  section: Section;
}

interface TaskState {
  date: string; // the "today" the app is anchored to
  tasks: Task[]; // today's tasks
  carryPending: CarryPending | null;
  loaded: boolean;
}

interface TaskActions {
  init: (carryEnabled: boolean) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  /** Rename an existing task (e.g. fixing a typo). No-op on empty/unchanged. */
  editTask: (id: string, text: string) => Promise<void>;
  /** Delete a task from today's list. */
  removeTask: (id: string) => Promise<void>;
  /** Append the check-in drafts to today's list, capped at 3 per section. */
  commitCheckin: (draftWork: string[], draftPersonal: string[]) => Promise<void>;
  doCarry: () => Promise<void>;
  doLetGo: () => void;
}

// A day holds at most this many tasks per section (work / personal).
export const MAX_PER_SECTION = 3;

function mkTask(date: string, text: string, section: Section, carried = false): Task {
  return {
    id: crypto.randomUUID(),
    date,
    section,
    text: text.trim(),
    done: false,
    carried,
    createdAt: Date.now() + Math.floor(Math.random() * 1000),
  };
}

// Dependency Inversion: store receives a repository interface (testable / swappable)
function createTaskStore(repo: ITaskRepository) {
  return create<TaskState & TaskActions>((set, get) => ({
    date: today(),
    tasks: [],
    carryPending: null,
    loaded: false,

    init: async (carryEnabled) => {
      const date = today();
      // Demo mode seeds sample history; otherwise clean up any stray seed rows.
      if (demoEnabled()) await seedHistory(repo, date);
      else await purgeLegacySeed(repo, date);
      const tasks = await repo.getByDate(date);

      // Carry-over nudge: surface one unfinished task from yesterday that we
      // haven't already pulled into today.
      let carryPending: CarryPending | null = null;
      if (carryEnabled) {
        const yesterday = addDays(date, -1);
        const prev = await repo.getByDate(yesterday);
        const alreadyHere = new Set(tasks.map((t) => t.text.toLowerCase()));
        const leftover = prev.find((t) => !t.done && !alreadyHere.has(t.text.toLowerCase()));
        if (leftover) carryPending = { text: leftover.text, section: leftover.section };
      }

      set({ date, tasks, carryPending, loaded: true });
    },

    toggleTask: async (id) => {
      const { tasks } = get();
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const updates = { done: !task.done };
      await repo.update(id, updates);
      set({ tasks: tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) });
    },

    editTask: async (id, text) => {
      const value = text.trim();
      const { tasks } = get();
      const task = tasks.find((t) => t.id === id);
      if (!value || !task || task.text === value) return;
      await repo.update(id, { text: value });
      set({ tasks: tasks.map((t) => (t.id === id ? { ...t, text: value } : t)) });
    },

    removeTask: async (id) => {
      const { tasks } = get();
      if (!tasks.some((t) => t.id === id)) return;
      await repo.remove(id);
      set({ tasks: tasks.filter((t) => t.id !== id) });
    },

    commitCheckin: async (draftWork, draftPersonal) => {
      const { date, tasks } = get();
      // Keep any tasks already logged today and only add up to the remaining
      // room in each section (3 per section, max).
      const room = (section: Section) =>
        Math.max(0, MAX_PER_SECTION - tasks.filter((t) => t.section === section).length);
      const built = [
        ...draftWork.slice(0, room("work")).map((t) => mkTask(date, t, "work")),
        ...draftPersonal.slice(0, room("personal")).map((t) => mkTask(date, t, "personal")),
      ];
      if (!built.length) return; // nothing to add - keep existing list untouched
      await repo.saveMany(built);
      set({ tasks: [...tasks, ...built] });
    },

    doCarry: async () => {
      const { carryPending, date, tasks } = get();
      if (!carryPending) return;
      const task = mkTask(date, carryPending.text, carryPending.section, true);
      await repo.save(task);
      set({ tasks: [...tasks, task], carryPending: null });
    },

    doLetGo: () => set({ carryPending: null }),
  }));
}

export const useTaskStore = createTaskStore(taskRepository);
