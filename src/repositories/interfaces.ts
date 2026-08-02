import type { Task, Reminder } from "@/types";

// Dependency Inversion: stores depend on these abstractions, not on IndexedDB directly.

export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  getByDate(date: string): Promise<Task[]>;
  getInRange(startDate: string, endDate: string): Promise<Task[]>;
  save(task: Task): Promise<void>;
  saveMany(tasks: Task[]): Promise<void>;
  update(id: string, updates: Partial<Omit<Task, "id">>): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface IReminderRepository {
  get(): Promise<Reminder | undefined>;
  save(reminder: Reminder): Promise<void>;
}
