import { Block, Subject, TYPES, BlockType } from "@/types";

// ─── ID / Color ───────────────────────────────────────────────────────────────

let _uidCounter = 0;

export function uid(prefix = "id"): string {
  _uidCounter++;
  return `${prefix}_${Date.now()}_${_uidCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

const PALETTE = [
  "#bfdbfe", "#bbf7d0", "#fde68a", "#fecdd3", "#ddd6fe",
  "#cffafe", "#fed7aa", "#d9f99d", "#fbcfe8", "#e0e7ff",
];

export function randomColor(): string {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

// ─── HTML escaping ────────────────────────────────────────────────────────────

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Block helpers ────────────────────────────────────────────────────────────

export function typeLabel(type: BlockType): string {
  return TYPES.find((t) => t.value === type)?.label ?? type;
}

export function getBlockColor(block: Block, subjects: Subject[]): string {
  if (block.type === "lektion") {
    const subject = subjects.find((s) => s.id === block.subjectId);
    return subject?.color ?? TYPES.find((t) => t.value === "lektion")!.color;
  }
  return TYPES.find((t) => t.value === block.type)?.color ?? "#ede9fe";
}

export interface BlockTitleParts {
  subjectPart: string;
  classPart: string;
  full: string;
}

export function getBlockTitleParts(block: Block, subjects: Subject[]): BlockTitleParts {
  if (block.type === "rast") return { subjectPart: "Rast", classPart: "", full: "Rast" };
  if (block.type === "rastvakt") return { subjectPart: "Rastvakt", classPart: "", full: "Rastvakt" };
  if (block.type === "mote") {
    const subjectPart = block.title || "Möte";
    return { subjectPart, classPart: "", full: subjectPart };
  }
  if (block.type === "planering") return { subjectPart: "Planering", classPart: "", full: "Planering" };
  if (block.type === "eget") {
    const subjectPart = block.title || "Eget block";
    return { subjectPart, classPart: "", full: subjectPart };
  }
  if (block.type === "notepad") return { subjectPart: "", classPart: "", full: "" };
  if (block.type !== "lektion") {
    const subjectPart = `${typeLabel(block.type)} (${block.start}–${block.end})`;
    return { subjectPart, classPart: "", full: subjectPart };
  }
  const subject = subjects.find((s) => s.id === block.subjectId);
  const subjectPart = subject?.name?.trim() || "Lektion";
  const classPart = (block.className || "").trim();
  return { subjectPart, classPart, full: classPart ? `${subjectPart} ${classPart}` : subjectPart };
}

export function buildBlockTitle(block: Block, subjects: Subject[]): string {
  return getBlockTitleParts(block, subjects).full;
}

// ─── Subject helpers ──────────────────────────────────────────────────────────

export function isSubjectPlanned(subject: Subject, weekKey: string): boolean {
  if (weekKey in subject.plannedByWeek) return subject.plannedByWeek[weekKey];
  return subject.planned;
}

export function getSubjectNotesForWeek(subject: Subject, weekKey: string): string {
  return subject.notesByWeek[weekKey] ?? "";
}

export function getBlockNotesForWeek(block: Block, weekKey: string): string {
  return block.notesByWeek[weekKey] ?? block.notes ?? "";
}

// ─── Block visibility ─────────────────────────────────────────────────────────

/**
 * A block in the weekly schedule is either:
 *  - A "template" block (no weekKey) → always visible unless excluded
 *  - A "one-off" block (has weekKey) → only visible in its own week
 *
 * Returns true if the block should be shown in the given weekKey.
 */
export function isBlockVisibleInWeek(block: Block, weekKey: string): boolean {
  if (block.weekKey && block.weekKey !== weekKey) return false;
  if (block.excludedWeekKeys?.includes(weekKey)) return false;
  return true;
}

// ─── Swedish sorting ──────────────────────────────────────────────────────────

const swedishCollator = new Intl.Collator("sv", { sensitivity: "base" });

export function compareSwedish(a: string, b: string): number {
  return swedishCollator.compare(a, b);
}

// ─── Class name helpers ───────────────────────────────────────────────────────

export function extractClassFromLegacy(block: Record<string, unknown>): string {
  // For old blocks that stored className in the subject name (e.g. "Matematik 6C")
  const subject = block.subjectName as string | undefined;
  if (!subject) return "";
  const match = subject.match(/\b(\d[A-Za-z])\b/);
  return match ? match[1] : "";
}

// ─── Number helpers ───────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
