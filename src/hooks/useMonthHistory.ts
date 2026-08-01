import { useEffect, useState } from "react";
import { taskRepository } from "@/repositories/indexeddb";
import { toDateString } from "@/utils/date";
import { generateMonthTasks } from "@/utils/history";
import type { DayDetailItem, Task } from "@/types";

export interface DayHistory {
  count: number; // completed items
  total: number;
  work: DayDetailItem[];
  personal: DayDetailItem[];
}

export type MonthHistory = Record<string, DayHistory>;

/** Group a flat task list into per-date history buckets. */
function groupTasks(tasks: Task[]): MonthHistory {
  const map: MonthHistory = {};
  for (const t of tasks) {
    const day = (map[t.date] ??= { count: 0, total: 0, work: [], personal: [] });
    day.total++;
    if (t.done) day.count++;
    const item = { text: t.text, done: t.done };
    if (t.section === "work") day.work.push(item);
    else day.personal.push(item);
  }
  return map;
}

/** How many days of a month should be filled when generating a fallback. */
function fallbackUpto(year: number, month: number): number {
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
    return new Date(year, month + 1, 0).getDate() + 1; // an entire past month
  }
  if (year === now.getFullYear() && month === now.getMonth()) return now.getDate(); // up to today
  return 1; // a future month - nothing to show
}

/**
 * Loads all tasks for the given month from IndexedDB and groups them by date.
 * `version` can be bumped to force a reload (e.g. after toggling a task). If
 * IndexedDB can't be read, falls back to the same deterministic history the
 * seeder uses, so the calendar never breaks or shows blank.
 */
export function useMonthHistory(year: number, month: number, version = 0): MonthHistory {
  const [history, setHistory] = useState<MonthHistory>({});

  useEffect(() => {
    let cancelled = false;
    const start = toDateString(new Date(year, month, 1));
    const end = toDateString(new Date(year, month + 1, 0));

    taskRepository
      .getInRange(start, end)
      .then((tasks) => {
        if (cancelled) return;
        setHistory(groupTasks(tasks));
      })
      .catch(() => {
        if (cancelled) return;
        setHistory(groupTasks(generateMonthTasks(year, month, fallbackUpto(year, month))));
      });

    return () => {
      cancelled = true;
    };
  }, [year, month, version]);

  return history;
}
