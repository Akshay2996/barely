// ── Domain types ──────────────────────────────────────────────────────

export type Section = "work" | "personal";

export interface Task {
  id: string;
  date: string; // YYYY-MM-DD
  section: Section;
  text: string;
  done: boolean;
  carried: boolean;
  createdAt: number;
  // Sync metadata. `updatedAt` drives last-write-wins merges; `deleted` is a
  // soft-delete tombstone so removals propagate across devices instead of
  // resurrecting. Both are optional for backwards-compat with pre-sync rows
  // (treat a missing `updatedAt` as `createdAt`).
  updatedAt?: number;
  deleted?: boolean;
}

export interface Reminder {
  id: "main";
  time: string; // HH:MM
  enabled: boolean;
}

export interface Settings {
  onboarded: boolean;
  reminderTime: string; // HH:MM
  reminderOn: boolean;
  carryEnabled: boolean;
  tone: Tone;
}

export type Tone = "Gentle" | "Extra gentle" | "A little sassy";

// ── Screens ───────────────────────────────────────────────────────────

export type Screen = "onboarding" | "checkin" | "today" | "progress" | "reminders";

// ── Calendar / history ────────────────────────────────────────────────

export interface DayDetailItem {
  text: string;
  done: boolean;
}

export interface DayDetail {
  weekday: string;
  label: string;
  summary: string;
  work: DayDetailItem[];
  personal: DayDetailItem[];
  isRest: boolean;
  source: string;
}

// ── UI ────────────────────────────────────────────────────────────────

export interface ToastItem {
  title: string;
  body: string;
}
