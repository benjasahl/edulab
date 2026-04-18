"use client";

import { useAppStore } from "@/store/useAppStore";
import { getReferenceDate, formatWeekLabel, getIsoWeekNumber, getWeekKey } from "@/lib/dateUtils";
import SubjectSidebar from "./SubjectSidebar";
import ScheduleGrid from "./ScheduleGrid";
import BlockDialog from "./BlockDialog";
import SubjectDialog from "./SubjectDialog";

const WEEK_TYPES = [
  { value: "normal",    label: "Normal" },
  { value: "lov",       label: "Lov" },
  { value: "studiedag", label: "Studiedag" },
  { value: "röd",       label: "Röd dag" },
] as const;

export default function PlannerView() {
  const weekOffset    = useAppStore((s) => s.data.ui.weekOffset);
  const selectedDate  = useAppStore((s) => s.data.ui.selectedDate);
  const locked        = useAppStore((s) => s.data.ui.locked);
  const weekMeta      = useAppStore((s) => s.data.weekMeta);
  const setWeekOffset = useAppStore((s) => s.setWeekOffset);
  const setSelectedDate = useAppStore((s) => s.setSelectedDate);
  const setWeekMeta   = useAppStore((s) => s.setWeekMeta);
  const setLocked     = useAppStore((s) => s.setLocked);
  const openSubjectDialog = useAppStore((s) => s.openSubjectDialog);

  const refDate  = getReferenceDate(weekOffset, selectedDate);
  const weekKey  = getWeekKey(refDate);
  const label    = formatWeekLabel(refDate);
  const weekNum  = getIsoWeekNumber(refDate);
  const year     = refDate.getFullYear();

  const currentMeta = weekMeta[weekKey];
  const weekType    = currentMeta?.type ?? "normal";

  function handlePrev() {
    setWeekOffset(weekOffset - 1);
    setSelectedDate("");
  }

  function handleNext() {
    setWeekOffset(weekOffset + 1);
    setSelectedDate("");
  }

  function handleToday() {
    setWeekOffset(0);
    setSelectedDate("");
  }

  function handleWeekType(type: string) {
    setWeekMeta(weekKey, { type });
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden px-1 py-1">
      {/* ── Week navigation bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ flexWrap: "nowrap" }}>
        {/* Prev / Today / Next */}
        <button
          onClick={handlePrev}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
        >
          &lsaquo; Föregående
        </button>

        <button
          onClick={handleToday}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
        >
          Idag
        </button>

        <button
          onClick={handleNext}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all"
        >
          Nästa &rsaquo;
        </button>

        {/* Week label */}
        <div className="flex items-baseline gap-1.5 mx-1">
          <span className="text-base font-semibold text-slate-800">{label}</span>
          <span className="text-xs text-slate-400 font-mono">v.{weekNum} · {year}</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Week type selector */}
        <div className="flex items-center gap-1">
          {WEEK_TYPES.map(({ value, label: wl }) => (
            <button
              key={value}
              onClick={() => handleWeekType(value)}
              className={[
                "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all",
                weekType === value
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              {wl}
            </button>
          ))}
        </div>

        {/* Lock toggle */}
        <button
          onClick={() => setLocked(!locked)}
          title={locked ? "Lås upp schema" : "Lås schema"}
          className={[
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
            locked
              ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
          ].join(" ")}
        >
          {locked ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Låst
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Redigera
            </>
          )}
        </button>

        {/* New subject button */}
        <button
          onClick={() => openSubjectDialog(null)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 active:scale-95 transition-all shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nytt ämne
        </button>
      </div>

      {/* ── Main layout: sidebar + grid ── */}
      <div className="flex flex-row gap-3 flex-1 min-h-0">
        <div className="w-52 flex-none">
          <SubjectSidebar />
        </div>
        <div className="flex-1 min-w-0">
          <ScheduleGrid />
        </div>
      </div>

      {/* Dialogs */}
      <BlockDialog />
      <SubjectDialog />
    </div>
  );
}
