"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  AppState,
  Block,
  Subject,
  SchoolClass,
  Student,
  ResultsSet,
  QuickLink,
  SeatingState,
  UIState,
  TopView,
  CloudSyncState,
  AuthUser,
  BlockDialogState,
  SubjectDialogState,
  MeetingNotesDialogState,
  Day,
  defaultState,
} from "@/types";
import { loadState, saveState } from "@/lib/storage";
import { uid, randomColor } from "@/lib/utils";
import { migrateState } from "@/lib/migration";

// ─── Store shape ──────────────────────────────────────────────────────────────

interface DialogsState {
  blockDialog: BlockDialogState;
  subjectDialog: SubjectDialogState;
  meetingNotesDialog: MeetingNotesDialogState;
  resultsDeletePendingId: string;
  classStudentDeletePendingIndex: number;
  classDeletePendingId: string;
  classEditPendingId: string;
  deleteAccountOpen: boolean;
  schemabrytandeOpen: boolean;
  schemabrytandeDay: string;
  addClassDialogOpen: boolean;
}

interface AppStore {
  // ── App data ──────────────────────────────────────────────────────────────
  data: AppState;

  // ── Cloud / auth ──────────────────────────────────────────────────────────
  cloudSync: CloudSyncState;

  // ── Dialogs ───────────────────────────────────────────────────────────────
  dialogs: DialogsState;

  // ── Boot state ────────────────────────────────────────────────────────────
  bootVisible: boolean;
  authMode: "signin" | "signup";

  // ─── Actions ─────────────────────────────────────────────────────────────

  // Data loading
  initState: () => void;
  loadFromCloud: (remoteData: AppState) => void;
  replaceState: (next: AppState) => void;

  // Persistence
  persist: () => void;

  // UI
  setTopView: (view: TopView) => void;
  setLocked: (locked: boolean) => void;
  setWeekOffset: (offset: number) => void;
  setSelectedDate: (date: string) => void;
  setActiveResultsSetId: (id: string) => void;
  setResultsSidebarCollapsed: (collapsed: boolean) => void;
  setActiveClassId: (id: string) => void;
  setScheduleHours: (startHour: number, endHour: number) => void;

  // Blocks
  addBlock: (block: Omit<Block, "id">) => Block;
  updateBlock: (id: string, changes: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  deleteBlockSeries: (seriesId: string) => void;
  deleteBlockAllDays: (seriesId: string, weekKey: string) => void;
  excludeBlockFromWeek: (id: string, weekKey: string) => void;

  // Subjects
  addSubject: (subject: Omit<Subject, "id">) => Subject;
  updateSubject: (id: string, changes: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  // Classes
  addClass: (cls: Omit<SchoolClass, "id">) => SchoolClass;
  updateClass: (id: string, changes: Partial<Omit<SchoolClass, "id" | "students">>) => void;
  deleteClass: (id: string) => void;
  addStudent: (classId: string, firstName: string, lastName: string) => Student;
  updateStudent: (classId: string, studentId: string, changes: Partial<Omit<Student, "id">>) => void;
  deleteStudent: (classId: string, studentIndex: number) => void;
  lockClass: (classId: string) => void;
  reorderClasses: (fromIdx: number, toIdx: number) => void;

  // Results
  addResultsSet: (set: Omit<ResultsSet, "id">) => ResultsSet;
  updateResultsSet: (id: string, changes: Partial<Omit<ResultsSet, "id">>) => void;
  deleteResultsSet: (id: string) => void;
  setResultValue: (setId: string, key: string, value: string) => void;
  addResultsStudent: (setId: string, name: string) => void;
  addResultsArea: (setId: string, area: string) => void;
  updateResultsStudent: (setId: string, idx: number, name: string) => void;
  updateResultsArea: (setId: string, idx: number, area: string) => void;
  deleteResultsStudent: (setId: string, idx: number) => void;
  deleteResultsArea: (setId: string, idx: number) => void;
  reorderResultsSets: (fromIdx: number, toIdx: number) => void;

  // Links
  addLink: (link: Omit<QuickLink, "id">) => QuickLink;
  updateLink: (id: string, changes: Partial<Omit<QuickLink, "id">>) => void;
  deleteLink: (id: string) => void;

  // Seating
  updateSeating: (changes: Partial<SeatingState>) => void;
  setSeatingGroups: (groups: string[][]) => void;

  // Week/day meta
  setWeekMeta: (weekKey: string, meta: { type: string }) => void;
  setDayMeta: (day: string, meta: Record<string, unknown>) => void;
  setWeeklyNotes: (weekKey: string, notes: string) => void;
  setWeeklyDayNotes: (day: Day, notes: string) => void;

  // Cloud sync state
  setCloudSync: (changes: Partial<CloudSyncState>) => void;
  setCloudUser: (user: AuthUser | null) => void;

  // Dialogs
  openBlockDialog: (state: Partial<BlockDialogState>) => void;
  closeBlockDialog: () => void;
  openSubjectDialog: (subjectId: string | null) => void;
  closeSubjectDialog: () => void;
  openMeetingNotesDialog: (blockId: string) => void;
  closeMeetingNotesDialog: () => void;
  setResultsDeletePending: (id: string) => void;
  setClassStudentDeletePending: (index: number) => void;
  setClassDeletePending: (id: string) => void;
  setClassEditPending: (id: string) => void;
  setDeleteAccountOpen: (open: boolean) => void;
  setSchemabrytandeOpen: (open: boolean, day?: string) => void;
  setAddClassDialogOpen: (open: boolean) => void;

  // Boot
  setBootVisible: (visible: boolean) => void;
  setAuthMode: (mode: "signin" | "signup") => void;
}

// ─── Initial dialogs ──────────────────────────────────────────────────────────

const initialDialogs: DialogsState = {
  blockDialog: { open: false, blockId: null },
  subjectDialog: { open: false, subjectId: null },
  meetingNotesDialog: { open: false, blockId: null },
  resultsDeletePendingId: "",
  classStudentDeletePendingIndex: -1,
  classDeletePendingId: "",
  classEditPendingId: "",
  deleteAccountOpen: false,
  schemabrytandeOpen: false,
  schemabrytandeDay: "",
  addClassDialogOpen: false,
};

// ─── Initial cloud sync ───────────────────────────────────────────────────────

const initialCloudSync: CloudSyncState = {
  initialized: false,
  configured: false,
  available: false,
  user: null,
  loadingRemote: false,
  syncInFlight: false,
  lastSyncedAt: "",
  lastError: "",
  pendingDirty: false,
  lastSavedHash: "",
  lastLoadedHash: "",
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  immer((set, get) => ({
    data: defaultState,
    cloudSync: initialCloudSync,
    dialogs: initialDialogs,
    bootVisible: true,
    authMode: "signin",

    // ─── Data loading ──────────────────────────────────────────────────────

    initState() {
      const loaded = loadState();
      const migrated = migrateState(loaded);
      set((s) => {
        s.data = migrated;
      });
    },

    loadFromCloud(remoteData) {
      const migrated = migrateState(remoteData);
      set((s) => {
        s.data = migrated;
      });
      get().persist();
    },

    replaceState(next) {
      set((s) => {
        s.data = next;
      });
      get().persist();
    },

    // ─── Persistence ───────────────────────────────────────────────────────

    persist() {
      saveState(get().data);
    },

    // ─── UI actions ────────────────────────────────────────────────────────

    setTopView(view) {
      set((s) => { s.data.ui.topView = view; });
      get().persist();
    },

    setLocked(locked) {
      set((s) => { s.data.ui.locked = locked; });
      get().persist();
    },

    setWeekOffset(offset) {
      set((s) => { s.data.ui.weekOffset = offset; });
      get().persist();
    },

    setSelectedDate(date) {
      set((s) => { s.data.ui.selectedDate = date; });
      get().persist();
    },

    setActiveResultsSetId(id) {
      set((s) => { s.data.ui.activeResultsSetId = id; });
      get().persist();
    },

    setResultsSidebarCollapsed(collapsed) {
      set((s) => { s.data.ui.resultsSidebarCollapsed = collapsed; });
      get().persist();
    },

    setActiveClassId(id) {
      set((s) => { s.data.ui.activeClassId = id; });
      get().persist();
    },

    setScheduleHours(startHour, endHour) {
      set((s) => {
        s.data.ui.startHour = startHour;
        s.data.ui.endHour = endHour;
      });
      get().persist();
    },

    // ─── Blocks ────────────────────────────────────────────────────────────

    addBlock(blockData) {
      const block: Block = { id: uid("blk"), ...blockData } as Block;
      set((s) => { s.data.blocks.push(block); });
      get().persist();
      return block;
    },

    updateBlock(id, changes) {
      set((s) => {
        const idx = s.data.blocks.findIndex((b) => b.id === id);
        if (idx !== -1) Object.assign(s.data.blocks[idx], changes);
      });
      get().persist();
    },

    deleteBlock(id) {
      set((s) => {
        s.data.blocks = s.data.blocks.filter((b) => b.id !== id);
      });
      get().persist();
    },

    deleteBlockSeries(seriesId) {
      set((s) => {
        s.data.blocks = s.data.blocks.filter((b) => b.seriesId !== seriesId);
      });
      get().persist();
    },

    deleteBlockAllDays(seriesId, weekKey) {
      set((s) => {
        s.data.blocks = s.data.blocks.filter(
          (b) => !(b.seriesId === seriesId && b.weekKey === weekKey)
        );
      });
      get().persist();
    },

    excludeBlockFromWeek(id, weekKey) {
      set((s) => {
        const block = s.data.blocks.find((b) => b.id === id);
        if (block && !block.excludedWeekKeys.includes(weekKey)) {
          block.excludedWeekKeys.push(weekKey);
        }
      });
      get().persist();
    },

    // ─── Subjects ─────────────────────────────────────────────────────────

    addSubject(subjectData) {
      const subject: Subject = { id: uid("sub"), ...subjectData } as Subject;
      set((s) => { s.data.subjects.push(subject); });
      get().persist();
      return subject;
    },

    updateSubject(id, changes) {
      set((s) => {
        const idx = s.data.subjects.findIndex((s2) => s2.id === id);
        if (idx !== -1) Object.assign(s.data.subjects[idx], changes);
      });
      get().persist();
    },

    deleteSubject(id) {
      set((s) => {
        s.data.subjects = s.data.subjects.filter((s2) => s2.id !== id);
        // Unlink from blocks
        s.data.blocks.forEach((b) => {
          b.linkedSubjectIds = b.linkedSubjectIds.filter((sid) => sid !== id);
          if (b.subjectId === id) b.subjectId = b.linkedSubjectIds[0] ?? "";
        });
      });
      get().persist();
    },

    // ─── Classes ──────────────────────────────────────────────────────────

    addClass(clsData) {
      const cls: SchoolClass = { id: uid("cls"), ...clsData };
      set((s) => { s.data.classes.push(cls); });
      get().persist();
      return cls;
    },

    updateClass(id, changes) {
      set((s) => {
        const idx = s.data.classes.findIndex((c) => c.id === id);
        if (idx !== -1) Object.assign(s.data.classes[idx], changes);
      });
      get().persist();
    },

    deleteClass(id) {
      set((s) => {
        s.data.classes = s.data.classes.filter((c) => c.id !== id);
      });
      get().persist();
    },

    addStudent(classId, firstName, lastName) {
      const student: Student = { id: uid("stu"), firstName, lastName };
      set((s) => {
        const cls = s.data.classes.find((c) => c.id === classId);
        if (cls) cls.students.push(student);
      });
      get().persist();
      return student;
    },

    updateStudent(classId, studentId, changes) {
      set((s) => {
        const cls = s.data.classes.find((c) => c.id === classId);
        if (cls) {
          const idx = cls.students.findIndex((st) => st.id === studentId);
          if (idx !== -1) Object.assign(cls.students[idx], changes);
        }
      });
      get().persist();
    },

    deleteStudent(classId, studentIndex) {
      set((s) => {
        const cls = s.data.classes.find((c) => c.id === classId);
        if (cls) cls.students.splice(studentIndex, 1);
      });
      get().persist();
    },

    lockClass(classId) {
      set((s) => {
        const cls = s.data.classes.find((c) => c.id === classId);
        if (cls) cls.locked = true;
      });
      get().persist();
    },

    reorderClasses(fromIdx, toIdx) {
      set((s) => {
        const [item] = s.data.classes.splice(fromIdx, 1);
        s.data.classes.splice(toIdx, 0, item);
      });
      get().persist();
    },

    // ─── Results ──────────────────────────────────────────────────────────

    addResultsSet(setData) {
      const set2: ResultsSet = { id: uid("res"), ...setData };
      set((s) => { s.data.resultsSets.push(set2); });
      get().persist();
      return set2;
    },

    updateResultsSet(id, changes) {
      set((s) => {
        const idx = s.data.resultsSets.findIndex((r) => r.id === id);
        if (idx !== -1) Object.assign(s.data.resultsSets[idx], changes);
      });
      get().persist();
    },

    deleteResultsSet(id) {
      set((s) => {
        s.data.resultsSets = s.data.resultsSets.filter((r) => r.id !== id);
      });
      get().persist();
    },

    setResultValue(setId, key, value) {
      set((s) => {
        const rs = s.data.resultsSets.find((r) => r.id === setId);
        if (rs) rs.values[key] = value;
      });
      get().persist();
    },

    addResultsStudent(setId, name) {
      set((s) => {
        const rs = s.data.resultsSets.find((r) => r.id === setId);
        if (rs) rs.students.push(name);
      });
      get().persist();
    },

    addResultsArea(setId, area) {
      set((s) => {
        const rs = s.data.resultsSets.find((r) => r.id === setId);
        if (rs) rs.areas.push(area);
      });
      get().persist();
    },

    updateResultsStudent(setId, idx, name) {
      set((s) => {
        const rs = s.data.resultsSets.find((r) => r.id === setId);
        if (rs) rs.students[idx] = name;
      });
      get().persist();
    },

    updateResultsArea(setId, idx, area) {
      set((s) => {
        const rs = s.data.resultsSets.find((r) => r.id === setId);
        if (rs) rs.areas[idx] = area;
      });
      get().persist();
    },

    deleteResultsStudent(setId, idx) {
      set((s) => {
        const rs = s.data.resultsSets.find((r) => r.id === setId);
        if (rs) {
          rs.students.splice(idx, 1);
          // Remove associated values
          const newValues: Record<string, string> = {};
          Object.entries(rs.values).forEach(([k, v]) => {
            const [aIdx, sIdx] = k.split("::").map(Number);
            if (sIdx !== idx) {
              const newSIdx = sIdx > idx ? sIdx - 1 : sIdx;
              newValues[`${aIdx}::${newSIdx}`] = v;
            }
          });
          rs.values = newValues;
        }
      });
      get().persist();
    },

    deleteResultsArea(setId, idx) {
      set((s) => {
        const rs = s.data.resultsSets.find((r) => r.id === setId);
        if (rs) {
          rs.areas.splice(idx, 1);
          const newValues: Record<string, string> = {};
          Object.entries(rs.values).forEach(([k, v]) => {
            const [aIdx, sIdx] = k.split("::").map(Number);
            if (aIdx !== idx) {
              const newAIdx = aIdx > idx ? aIdx - 1 : aIdx;
              newValues[`${newAIdx}::${sIdx}`] = v;
            }
          });
          rs.values = newValues;
        }
      });
      get().persist();
    },

    reorderResultsSets(fromIdx, toIdx) {
      set((s) => {
        const [item] = s.data.resultsSets.splice(fromIdx, 1);
        s.data.resultsSets.splice(toIdx, 0, item);
      });
      get().persist();
    },

    // ─── Links ────────────────────────────────────────────────────────────

    addLink(linkData) {
      const link: QuickLink = { id: uid("lnk"), ...linkData };
      set((s) => { s.data.links.push(link); });
      get().persist();
      return link;
    },

    updateLink(id, changes) {
      set((s) => {
        const idx = s.data.links.findIndex((l) => l.id === id);
        if (idx !== -1) Object.assign(s.data.links[idx], changes);
      });
      get().persist();
    },

    deleteLink(id) {
      set((s) => {
        s.data.links = s.data.links.filter((l) => l.id !== id);
      });
      get().persist();
    },

    // ─── Seating ──────────────────────────────────────────────────────────

    updateSeating(changes) {
      set((s) => { Object.assign(s.data.seating, changes); });
      get().persist();
    },

    setSeatingGroups(groups) {
      set((s) => { s.data.seating.groups = groups; });
      get().persist();
    },

    // ─── Week/day meta ─────────────────────────────────────────────────────

    setWeekMeta(weekKey, meta) {
      set((s) => { s.data.weekMeta[weekKey] = meta as WeekMeta; });
      get().persist();
    },

    setDayMeta(day, meta) {
      set((s) => { s.data.dayMeta[day] = meta as unknown as DayMeta; });
      get().persist();
    },

    setWeeklyNotes(weekKey, notes) {
      set((s) => { s.data.weeklyNotes[weekKey] = notes; });
      get().persist();
    },

    setWeeklyDayNotes(day, notes) {
      set((s) => { s.data.weeklyDayNotes[day] = notes; });
      get().persist();
    },

    // ─── Cloud sync ───────────────────────────────────────────────────────

    setCloudSync(changes) {
      set((s) => { Object.assign(s.cloudSync, changes); });
    },

    setCloudUser(user) {
      set((s) => { s.cloudSync.user = user; });
    },

    // ─── Dialogs ──────────────────────────────────────────────────────────

    openBlockDialog(state2) {
      set((s) => { s.dialogs.blockDialog = { open: true, blockId: null, ...state2 }; });
    },

    closeBlockDialog() {
      set((s) => { s.dialogs.blockDialog = { open: false, blockId: null }; });
    },

    openSubjectDialog(subjectId) {
      set((s) => { s.dialogs.subjectDialog = { open: true, subjectId }; });
    },

    closeSubjectDialog() {
      set((s) => { s.dialogs.subjectDialog = { open: false, subjectId: null }; });
    },

    openMeetingNotesDialog(blockId) {
      set((s) => { s.dialogs.meetingNotesDialog = { open: true, blockId }; });
    },

    closeMeetingNotesDialog() {
      set((s) => { s.dialogs.meetingNotesDialog = { open: false, blockId: null }; });
    },

    setResultsDeletePending(id) {
      set((s) => { s.dialogs.resultsDeletePendingId = id; });
    },

    setClassStudentDeletePending(index) {
      set((s) => { s.dialogs.classStudentDeletePendingIndex = index; });
    },

    setClassDeletePending(id) {
      set((s) => { s.dialogs.classDeletePendingId = id; });
    },

    setClassEditPending(id) {
      set((s) => { s.dialogs.classEditPendingId = id; });
    },

    setDeleteAccountOpen(open) {
      set((s) => { s.dialogs.deleteAccountOpen = open; });
    },

    setSchemabrytandeOpen(open, day) {
      set((s) => {
        s.dialogs.schemabrytandeOpen = open;
        s.dialogs.schemabrytandeDay = day ?? "";
      });
    },

    setAddClassDialogOpen(open) {
      set((s) => { s.dialogs.addClassDialogOpen = open; });
    },

    // ─── Boot ─────────────────────────────────────────────────────────────

    setBootVisible(visible) {
      set((s) => { s.bootVisible = visible; });
    },

    setAuthMode(mode) {
      set((s) => { s.authMode = mode; });
    },
  }))
);

// ─── Typed imports for immer middleware ───────────────────────────────────────
import type { WeekMeta, DayMeta } from "@/types";
