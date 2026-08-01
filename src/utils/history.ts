import type { Task, Section } from "@/types";
import { toDateString } from "./date";

/** How many whole months of history we seed/allow browsing before "today". */
export const SEED_MONTHS_BACK = 6;

// Bare-minimum, on-brand task pools used to fabricate a believable history.
const WORK_POOL = [
  "Reply to two emails",
  "Open the doc, write one line",
  "15 minutes on the deck",
  "Tidy one folder",
  "Send the follow-up",
  "Skim one PR",
  "Outline the next step",
];
const PERSONAL_POOL = [
  "Drink a glass of water",
  "Short walk outside",
  "Stretch for five minutes",
  "Text a friend back",
  "Make the bed",
  "Step away from the screen",
];

// mulberry32 - a tiny deterministic PRNG. Same seed ⇒ same sequence.
function rng(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a hash of the date string → a stable numeric seed for that day.
function hashDate(dateStr: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], r: () => number, n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(r() * copy.length), 1)[0]);
  }
  return out;
}

/**
 * Deterministic set of tasks for a single date. The same date always yields the
 * exact same tasks and completion states - an empty array means a rest day.
 */
export function generateDayTasks(dateStr: string): Task[] {
  const r = rng(hashDate(dateStr));
  // Roughly one day in six is a genuine (empty) rest day.
  if (r() < 0.17) return [];

  const workN = 1 + Math.floor(r() * 3); // 1-3
  const personalN = Math.floor(r() * 3); // 0-2
  const base = new Date(dateStr + "T09:00:00").getTime();

  const build = (text: string, section: Section, i: number): Task => ({
    id: `seed-${dateStr}-${section}-${i}`,
    date: dateStr,
    section,
    text,
    done: r() < 0.72, // most bare-minimum things actually get done
    carried: false,
    createdAt: base + i * 60000,
  });

  return [
    ...pick(WORK_POOL, r, workN).map((t, i) => build(t, "work", i)),
    ...pick(PERSONAL_POOL, r, personalN).map((t, i) => build(t, "personal", i)),
  ];
}

/**
 * Deterministic seed tasks for every day of a month strictly before `uptoDay`
 * (today is excluded - that belongs to the user's real check-in).
 */
export function generateMonthTasks(year: number, month: number, uptoDay: number): Task[] {
  const out: Task[] = [];
  for (let d = 1; d < uptoDay; d++) {
    out.push(...generateDayTasks(toDateString(new Date(year, month, d))));
  }
  return out;
}

/**
 * Deterministic history for the seeder: `monthsBack` full prior months plus the
 * current month up to (but excluding) today.
 */
export function generateSeedHistory(today: Date, monthsBack: number): Task[] {
  const y = today.getFullYear();
  const m = today.getMonth();
  const out: Task[] = [];
  for (let back = monthsBack; back >= 1; back--) {
    const d = new Date(y, m - back, 1);
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    out.push(...generateMonthTasks(d.getFullYear(), d.getMonth(), days + 1));
  }
  out.push(...generateMonthTasks(y, m, today.getDate()));
  return out;
}
