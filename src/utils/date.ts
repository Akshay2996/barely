const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function today(): string {
  // Test-only override: set localStorage "barely:test-today" to a YYYY-MM-DD
  // string to simulate a different day (used to exercise carry-over). Ignored
  // in normal use.
  try {
    const override = localStorage.getItem("barely:test-today");
    if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
  } catch {
    /* ignore */
  }
  return toDateString(new Date());
}

/** Shift a YYYY-MM-DD string by n days (n may be negative). */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toDateString(d);
}

/** "Monday" */
export function weekdayLong(dateStr: string): string {
  return DAYS[new Date(dateStr + "T00:00:00").getDay()];
}

/** "July 30" */
export function monthDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
