import {
  AppState,
  defaultState,
  FIXED_SCHEDULE_START,
  FIXED_SCHEDULE_END,
  Block,
  Subject,
  ResultsSet,
  SchoolClass,
} from "@/types";
import { uid, randomColor, extractClassFromLegacy } from "@/lib/utils";
import { getWeekKey } from "@/lib/dateUtils";

export function migrateState(raw: unknown): AppState {
  if (!raw || typeof raw !== "object") return structuredClone(defaultState);

  const partial = raw as Partial<AppState>;
  const state: AppState = {
    ...structuredClone(defaultState),
    ...partial,
  };

  // ── UI
  state.ui = state.ui ?? { ...defaultState.ui };
  state.ui.locked = typeof state.ui.locked === "boolean" ? state.ui.locked : false;
  state.ui.startHour =
    typeof state.ui.startHour === "number" ? state.ui.startHour : FIXED_SCHEDULE_START;
  state.ui.endHour =
    typeof state.ui.endHour === "number" ? state.ui.endHour : FIXED_SCHEDULE_END;
  state.ui.weekOffset =
    typeof state.ui.weekOffset === "number" ? state.ui.weekOffset : 0;
  state.ui.selectedDate =
    typeof state.ui.selectedDate === "string" ? state.ui.selectedDate : "";
  state.ui.topView =
    typeof state.ui.topView === "string" ? state.ui.topView : "planner";
  state.ui.activeResultsSetId =
    typeof state.ui.activeResultsSetId === "string" ? state.ui.activeResultsSetId : "";
  state.ui.resultsSidebarCollapsed =
    typeof state.ui.resultsSidebarCollapsed === "boolean"
      ? state.ui.resultsSidebarCollapsed
      : false;
  state.ui.activeClassId =
    typeof state.ui.activeClassId === "string" ? state.ui.activeClassId : "";

  // ── Meta stores
  state.weekMeta = state.weekMeta && typeof state.weekMeta === "object" ? state.weekMeta : {};
  state.dayMeta = state.dayMeta && typeof state.dayMeta === "object" ? state.dayMeta : {};
  state.weeklyNotes =
    state.weeklyNotes && typeof state.weeklyNotes === "object" ? state.weeklyNotes : {};
  state.weeklyDayNotes =
    state.weeklyDayNotes && typeof state.weeklyDayNotes === "object"
      ? state.weeklyDayNotes
      : {};

  // ── Blocks
  const migrationWeekKey = getWeekKey();
  if (!Array.isArray(state.blocks)) state.blocks = [];
  state.blocks = (state.blocks as unknown as Array<Partial<Block> & Record<string, unknown>>).map((block) => {
    const migrated: Block = {
      id: (block.id as string) || uid("blk"),
      day: (block.day as Block["day"]) || "Måndag",
      type: (block.type as Block["type"]) || "lektion",
      start: (block.start as string) || "08:00",
      end: (block.end as string) || "09:00",
      subjectId: (block.subjectId as string) || "",
      className: (block.className as string) || extractClassFromLegacy(block) || "",
      location: (block.location as string) || "",
      notes: (block.notes as string) || "",
      title: (block.title as string) || "",
      linkedSubjectIds: Array.isArray(block.linkedSubjectIds) ? block.linkedSubjectIds as string[] : [],
      seriesId: typeof block.seriesId === "string" ? block.seriesId : "",
      weekKey: typeof block.weekKey === "string" ? block.weekKey : "",
      excludedWeekKeys: Array.isArray(block.excludedWeekKeys)
        ? [...new Set((block.excludedWeekKeys as string[]).filter(Boolean))]
        : [],
      notesByWeek:
        block.notesByWeek && typeof block.notesByWeek === "object"
          ? (block.notesByWeek as Record<string, string>)
          : {},
    };

    // Migrate old "notes" field to notesByWeek
    if (migrated.notes && !(migrationWeekKey in migrated.notesByWeek)) {
      migrated.notesByWeek[migrationWeekKey] = migrated.notes;
    }

    // Clean up break types
    if (["rast", "rastvakt", "notepad"].includes(migrated.type)) {
      migrated.subjectId = "";
      migrated.className = "";
      migrated.linkedSubjectIds = [];
    }

    // Ensure primary subjectId is in linkedSubjectIds
    if (
      migrated.subjectId &&
      !migrated.linkedSubjectIds.includes(migrated.subjectId)
    ) {
      migrated.linkedSubjectIds.unshift(migrated.subjectId);
    }

    return migrated;
  });

  // ── Subjects
  if (!Array.isArray(state.subjects)) state.subjects = [];
  state.subjects = (state.subjects as unknown as Array<Partial<Subject> & Record<string, unknown>>).map((subject) => {
    const migrated: Subject = {
      id: (subject.id as string) || uid("sub"),
      name: (subject.name as string) || "",
      color: (subject.color as string) || randomColor(),
      planned: typeof subject.planned === "boolean" ? subject.planned : false,
      linkedBlockIds: Array.isArray(subject.linkedBlockIds) ? subject.linkedBlockIds as string[] : [],
      panelHeight: typeof subject.panelHeight === "number" ? subject.panelHeight : 60,
      notesByWeek:
        subject.notesByWeek && typeof subject.notesByWeek === "object"
          ? (subject.notesByWeek as Record<string, string>)
          : {},
      plannedByWeek:
        subject.plannedByWeek && typeof subject.plannedByWeek === "object"
          ? (subject.plannedByWeek as Record<string, boolean>)
          : {},
    };

    // Migrate legacy notes
    const legacyNotes = (subject as Record<string, unknown>).notes as string | undefined;
    if (legacyNotes && !(migrationWeekKey in migrated.notesByWeek)) {
      migrated.notesByWeek[migrationWeekKey] = legacyNotes;
    }
    if (typeof subject.planned === "boolean" && !(migrationWeekKey in migrated.plannedByWeek)) {
      migrated.plannedByWeek[migrationWeekKey] = subject.planned;
    }

    return migrated;
  });

  // ── Results sets
  if (!Array.isArray(state.resultsSets)) state.resultsSets = [];
  state.resultsSets = state.resultsSets.map((set: Partial<ResultsSet>) => ({
    id: set.id || uid("res"),
    subject: set.subject || "",
    className: set.className || "",
    classId: set.classId || "",
    color: set.color || randomColor(),
    students: Array.isArray(set.students)
      ? set.students.map((s) => String(s || ""))
      : [],
    areas: Array.isArray(set.areas) ? set.areas.map((a) => String(a || "")) : [],
    values:
      set.values && typeof set.values === "object" ? { ...set.values } : {},
  }));

  // ── Classes
  if (!Array.isArray(state.classes)) state.classes = [];
  state.classes = state.classes.map((cls: Partial<SchoolClass>) => ({
    id: cls.id || uid("cls"),
    name: cls.name || "",
    locked: !!cls.locked,
    students: Array.isArray(cls.students)
      ? cls.students.map((s) => ({
          id: s?.id || uid("stu"),
          firstName: s?.firstName || "",
          lastName: s?.lastName || "",
        }))
      : [],
  }));

  // ── Links
  if (!Array.isArray(state.links)) state.links = [];

  // ── Seating
  if (!state.seating || typeof state.seating !== "object") {
    state.seating = structuredClone(defaultState.seating);
  }

  // ── Reconcile subject links
  reconcileSubjectLinks(state);

  return state;
}

function reconcileSubjectLinks(state: AppState): void {
  const validBlockIds = new Set(state.blocks.map((b) => b.id));
  const validSubjectIds = new Set(state.subjects.map((s) => s.id));

  state.subjects.forEach((subject) => {
    if (!Array.isArray(subject.linkedBlockIds)) subject.linkedBlockIds = [];
    subject.linkedBlockIds = subject.linkedBlockIds.filter((id) =>
      validBlockIds.has(id)
    );
  });

  state.blocks.forEach((block) => {
    if (!Array.isArray(block.linkedSubjectIds)) block.linkedSubjectIds = [];
    block.linkedSubjectIds = block.linkedSubjectIds.filter((id) =>
      validSubjectIds.has(id)
    );

    if (["rast", "rastvakt", "notepad"].includes(block.type)) {
      block.subjectId = "";
      block.className = "";
      block.linkedSubjectIds = [];
    } else {
      if (block.subjectId && !validSubjectIds.has(block.subjectId))
        block.subjectId = "";
      if (block.subjectId && !block.linkedSubjectIds.includes(block.subjectId))
        block.linkedSubjectIds.unshift(block.subjectId);
      if (!block.subjectId && block.linkedSubjectIds.length)
        block.subjectId = block.linkedSubjectIds[0];
    }

    // Ensure bidirectional links
    block.linkedSubjectIds.forEach((subjectId) => {
      const subject = state.subjects.find((s) => s.id === subjectId);
      if (subject && !subject.linkedBlockIds.includes(block.id)) {
        subject.linkedBlockIds.push(block.id);
      }
    });
  });
}
