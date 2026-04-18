// ─── Block types ────────────────────────────────────────────────────────────

export type BlockType =
  | "lektion"
  | "rast"
  | "rastvakt"
  | "planering"
  | "mote"
  | "resurs"
  | "eget"
  | "notepad"
  | "ovrigt";

export type Day =
  | "Måndag"
  | "Tisdag"
  | "Onsdag"
  | "Torsdag"
  | "Fredag";

export const DAYS: Day[] = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];

export interface BlockTypeDefinition {
  value: BlockType;
  label: string;
  color: string;
}

export const TYPES: BlockTypeDefinition[] = [
  { value: "lektion",   label: "Lektion",     color: "#dcfce7" },
  { value: "rast",      label: "Rast",        color: "#fef3c7" },
  { value: "rastvakt",  label: "Rastvakt",    color: "#fde68a" },
  { value: "planering", label: "Planering",   color: "#dbeafe" },
  { value: "mote",      label: "Möte",        color: "#fce7f3" },
  { value: "resurs",    label: "Resurs",      color: "#cffafe" },
  { value: "eget",      label: "Eget block",  color: "#e5e7eb" },
  { value: "notepad",   label: "Skrivblock",  color: "#f1f5f9" },
  { value: "ovrigt",    label: "Övrigt",      color: "#ede9fe" },
];

export const FIXED_SCHEDULE_START = 7.5;
export const FIXED_SCHEDULE_END = 16.5;
export const STORAGE_KEY = "lararplanering_v5";
export const LOCAL_BACKUP_KEY = "lararplanering_v5_local_backup_before_cloud_load";

// ─── Data models ─────────────────────────────────────────────────────────────

export interface Block {
  id: string;
  day: Day;
  type: BlockType;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  subjectId: string;
  className: string;
  location: string;
  notes: string;
  title: string;
  linkedSubjectIds: string[];
  seriesId: string;
  weekKey: string;
  excludedWeekKeys: string[];
  notesByWeek: Record<string, string>;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  planned: boolean;
  linkedBlockIds: string[];
  panelHeight: number;
  notesByWeek: Record<string, string>;
  plannedByWeek: Record<string, boolean>;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  locked: boolean;
  students: Student[];
}

export interface ResultsSet {
  id: string;
  subject: string;
  className: string;
  classId: string;
  color: string;
  students: string[];
  areas: string[];
  values: Record<string, string>;
}

export interface QuickLink {
  id: string;
  name: string;
  url: string;
}

export interface ExclusionRule {
  rule: string;
  studentIds: string[];
}

export interface SeatingState {
  activeClassId: string;
  mode: "size" | "count";
  groupSize: number;
  groupCount: number;
  exclusions: ExclusionRule[];
  groups: string[][];
  lastStats: Record<string, unknown> | null;
}

export interface UIState {
  locked: boolean;
  startHour: number;
  endHour: number;
  weekOffset: number;
  selectedDate: string;
  topView: TopView;
  activeResultsSetId: string;
  resultsSidebarCollapsed: boolean;
  activeClassId: string;
}

export type TopView =
  | "planner"
  | "results"
  | "adjustments"
  | "homework"
  | "seating"
  | "classes"
  | "links";

export interface WeekMeta {
  type: "lov" | "normal" | "studiedag" | "röd";
}

export interface DayMeta {
  type: string;
  breakStart?: string;
  breakEnd?: string;
  breakLabel?: string;
}

// ─── Full app state ───────────────────────────────────────────────────────────

export interface AppState {
  ui: UIState;
  weekMeta: Record<string, WeekMeta>;
  dayMeta: Record<string, DayMeta>;
  weeklyNotes: Record<string, string>;
  weeklyDayNotes: Record<string, string>;
  blocks: Block[];
  subjects: Subject[];
  resultsSets: ResultsSet[];
  classes: SchoolClass[];
  links: QuickLink[];
  seating: SeatingState;
}

export const defaultState: AppState = {
  ui: {
    locked: false,
    startHour: FIXED_SCHEDULE_START,
    endHour: FIXED_SCHEDULE_END,
    weekOffset: 0,
    selectedDate: "",
    topView: "planner",
    activeResultsSetId: "",
    resultsSidebarCollapsed: false,
    activeClassId: "",
  },
  weekMeta: {},
  dayMeta: {},
  weeklyNotes: {},
  weeklyDayNotes: {},
  blocks: [],
  subjects: [],
  resultsSets: [],
  classes: [],
  links: [],
  seating: {
    activeClassId: "",
    mode: "size",
    groupSize: 2,
    groupCount: 2,
    exclusions: [],
    groups: [],
    lastStats: null,
  },
};

// ─── Auth / Cloud sync ────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  uid: string;
  email?: string;
}

export interface CloudSyncState {
  initialized: boolean;
  configured: boolean;
  available: boolean;
  user: AuthUser | null;
  loadingRemote: boolean;
  syncInFlight: boolean;
  lastSyncedAt: string;
  lastError: string;
  pendingDirty: boolean;
  lastSavedHash: string;
  lastLoadedHash: string;
}

// ─── Dialog state ─────────────────────────────────────────────────────────────

export interface BlockDialogState {
  open: boolean;
  blockId: string | null;
  day?: Day;
  start?: string;
  end?: string;
}

export interface SubjectDialogState {
  open: boolean;
  subjectId: string | null;
}

export interface MeetingNotesDialogState {
  open: boolean;
  blockId: string | null;
}

export type BlockScopeChoice = "single" | "allDays" | "all";

export interface BlockScopeDialogState {
  open: boolean;
  resolve: ((choice: BlockScopeChoice) => void) | null;
  title: string;
  text: string;
}

// ─── Drag/drop ────────────────────────────────────────────────────────────────

export interface DragBlockPayload {
  blockId: string;
  offsetMinutes: number;
  originalDay: Day;
  originalStart: string;
  originalEnd: string;
}

export interface ResizePayload {
  blockId: string;
  edge: "top" | "bottom";
  originalStart: string;
  originalEnd: string;
}
