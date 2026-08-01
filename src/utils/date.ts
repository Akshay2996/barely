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
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
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

/** "Wednesday, July 30, 2025" */
export function formatLong(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Wednesday, July 30" */
export function formatMedium(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** "Jul 30" */
export function formatShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** "July 2025" */
export function formatMonthYear(year: number, month: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 0 = Sunday, 1 = Monday … */
export function getFirstWeekday(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
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

