import { useEffect, useState } from "react";
import { taskRepository } from "@/repositories/indexeddb";
import { toDateString } from "@/utils/date";
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

/**
 * Loads the user's real tasks for the given month from IndexedDB and groups
 * them by date. `version` can be bumped to force a reload (e.g. after toggling
 * a task). If storage can't be read, the month is simply empty.
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
        if (!cancelled) setHistory(groupTasks(tasks));
      })
      .catch(() => {
        if (!cancelled) setHistory({});
      });

    return () => {
      cancelled = true;
    };
  }, [year, month, version]);

  return history;
}
