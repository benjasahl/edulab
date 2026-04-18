// Swedish grade scale: A=5, B=4, C=3, D=2, E=1, F=0
const GRADE_MAP: Record<string, number> = {
  A: 5, B: 4, C: 3, D: 2, E: 1, F: 0,
};
const REVERSE_GRADE: Record<number, string> = {
  5: "A", 4: "B", 3: "C", 2: "D", 1: "E", 0: "F",
};

/** Parse a grade string to a numeric value 0–5, or NaN if invalid. */
export function parseResultValue(raw: string): number {
  if (!raw) return NaN;
  const upper = raw.toUpperCase().trim();
  if (upper in GRADE_MAP) return GRADE_MAP[upper];
  // Numeric input (allow comma as decimal separator)
  const normalized = upper.replace(",", ".");
  const num = parseFloat(normalized);
  if (!isNaN(num) && num >= 0 && num <= 5) return num;
  return NaN;
}

/** Normalize raw user input to stored value. */
export function normalizeResultInput(raw: string): string {
  if (!raw) return "";
  const upper = raw.toUpperCase().trim();
  if (upper in GRADE_MAP) return upper;
  const normalized = upper.replace(",", ".");
  const num = parseFloat(normalized);
  if (!isNaN(num) && num >= 0 && num <= 5) return String(num);
  return raw;
}

/** Format stored value for display (use comma for Swedish locale). */
export function formatResultDisplay(value: string): string {
  if (!value) return "";
  return value.replace(".", ",");
}

/** Calculate an average from an array of raw grade strings. */
export function calculateAverage(values: string[]): number | null {
  const nums = values.map(parseResultValue).filter((n) => !isNaN(n));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Format an average for display. */
export function formatAverage(avg: number | null): string {
  if (avg === null) return "–";
  return avg.toFixed(2).replace(".", ",");
}

/** Convert a numeric average to the nearest letter grade. */
export function getGradeFromAverage(avg: number | null): string {
  if (avg === null) return "–";
  const rounded = Math.round(avg);
  return REVERSE_GRADE[Math.max(0, Math.min(5, rounded))] ?? "–";
}

/**
 * Returns a CSS background colour for a result value.
 * Green for high grades, yellow for middle, red for low.
 */
export function getResultCellColor(value: string): string {
  const num = parseResultValue(value);
  if (isNaN(num)) return "";
  if (num >= 4) return "var(--result-high, #dcfce7)";
  if (num >= 2) return "var(--result-mid, #fef9c3)";
  return "var(--result-low, #fee2e2)";
}
