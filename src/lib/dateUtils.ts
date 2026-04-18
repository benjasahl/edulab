import { Day, DAYS } from "@/types";

// ─── ISO week utilities ───────────────────────────────────────────────────────

/** Returns the Monday of the ISO week that contains `date`. */
export function getStartOfIsoWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** ISO week number (1–53). */
export function getIsoWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    )
  );
}

/** "YYYY-WNN" key for a date. */
export function getWeekKey(date?: Date): string {
  const d = date ?? new Date();
  const weekStart = getStartOfIsoWeek(d);
  const year = weekStart.getFullYear();
  const week = getIsoWeekNumber(weekStart);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * Returns the Monday of the week at `weekOffset` from today.
 * weekOffset=0 → current week, weekOffset=-1 → last week, etc.
 */
export function getReferenceDate(weekOffset: number, selectedDate?: string): Date {
  if (selectedDate) {
    const d = new Date(selectedDate);
    if (!isNaN(d.getTime())) {
      return getStartOfIsoWeek(d);
    }
  }
  const base = getStartOfIsoWeek(new Date());
  base.setDate(base.getDate() + weekOffset * 7);
  return base;
}

/** Returns the Date for a specific day of the displayed week. */
export function getDateForDay(weekStart: Date, dayIndex: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d;
}

/** "v.NN, YYYY" label */
export function formatWeekLabel(date: Date): string {
  const weekStart = getStartOfIsoWeek(date);
  const weekNum = getIsoWeekNumber(weekStart);
  return `v.${weekNum}, ${weekStart.getFullYear()}`;
}

/** "NN/MM" day/month label */
export function formatDayMonth(date: Date): string {
  const d = date.getDate();
  const m = date.getMonth() + 1;
  return `${d}/${m}`;
}

/** Returns true if the given date is today. */
export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** Current time as fractional hours (e.g. 9.5 = 09:30). */
export function currentHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

// ─── Time/minutes helpers ─────────────────────────────────────────────────────

/** "HH:MM" → total minutes from midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Total minutes → "HH:MM". */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Snap minutes value to nearest 5. */
export function snapToFive(minutes: number): number {
  return Math.round(minutes / 5) * 5;
}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Day helpers ──────────────────────────────────────────────────────────────

export function dayIndex(day: Day): number {
  return DAYS.indexOf(day);
}

/** Returns true if the given weekday (0=Sun) is a weekend day. */
export function isWeekend(jsDay: number): boolean {
  return jsDay === 0 || jsDay === 6;
}

/** Day index (0–4 for Mon–Fri) to a Date in the given week. */
export function dayToDate(weekStart: Date, idx: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + idx);
  return d;
}

/** Format fractional hours as "HH:MM". */
export function formatHour(h: number): string {
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
