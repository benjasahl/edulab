"use client";

import { useRef, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useDragDrop } from "@/hooks/useDragDrop";
import {
  DAYS,
  FIXED_SCHEDULE_START,
  FIXED_SCHEDULE_END,
} from "@/types";
import {
  getReferenceDate,
  getWeekKey,
  getDateForDay,
  formatDayMonth,
  currentHour,
  isToday,
  minutesToTime,
  snapToFive,
} from "@/lib/dateUtils";
import ScheduleBlock from "./ScheduleBlock";

// Hours to show tick marks for (full hours within the window)
const HOUR_TICKS = Array.from(
  { length: Math.ceil(FIXED_SCHEDULE_END) - Math.floor(FIXED_SCHEDULE_START) + 1 },
  (_, i) => Math.floor(FIXED_SCHEDULE_START) + i
).filter((h) => h <= Math.ceil(FIXED_SCHEDULE_END));

const TOTAL_MINS = (FIXED_SCHEDULE_END - FIXED_SCHEDULE_START) * 60;
const SCHED_START_MINS = FIXED_SCHEDULE_START * 60;

function hourToPercent(hour: number): number {
  return ((hour * 60 - SCHED_START_MINS) / TOTAL_MINS) * 100;
}

export default function ScheduleGrid() {
  const blocks        = useAppStore((s) => s.data.blocks);
  const weekOffset    = useAppStore((s) => s.data.ui.weekOffset);
  const selectedDate  = useAppStore((s) => s.data.ui.selectedDate);
  const locked        = useAppStore((s) => s.data.ui.locked);
  const openBlockDialog = useAppStore((s) => s.openBlockDialog);

  const gridRef = useRef<HTMLDivElement>(null);

  const { startDrag, startResize } = useDragDrop(
    FIXED_SCHEDULE_START,
    FIXED_SCHEDULE_END,
    gridRef
  );

  const refDate = getReferenceDate(weekOffset, selectedDate);
  const weekKey = getWeekKey(refDate);

  // Blocks visible in this week
  const weekBlocks = blocks.filter(
    (b) => b.weekKey === weekKey && !b.excludedWeekKeys.includes(weekKey)
  );

  const curHour = currentHour();
  const curLineVisible =
    curHour >= FIXED_SCHEDULE_START && curHour <= FIXED_SCHEDULE_END;
  const curLineTop = `${hourToPercent(curHour)}%`;

  // Click on empty grid area to open create-block dialog
  const handleDayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, day: (typeof DAYS)[number]) => {
      if (locked) return;
      // Only fire on direct day-col click (not on a block)
      if ((e.target as HTMLElement).closest(".block")) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const relY  = e.clientY - rect.top;
      const rawMins = SCHED_START_MINS + (relY / rect.height) * TOTAL_MINS;
      const startMins = snapToFive(
        Math.max(SCHED_START_MINS, Math.min(FIXED_SCHEDULE_END * 60 - 30, rawMins))
      );
      const endMins = startMins + 60;
      openBlockDialog({
        day,
        start: minutesToTime(startMins),
        end: minutesToTime(Math.min(endMins, FIXED_SCHEDULE_END * 60)),
      });
    },
    [locked, openBlockDialog]
  );

  return (
    <div className="schedule-wrap h-full">
      <div className="schedule">
        <div className="schedule-grid-layout">
          {/* ── Time column ── */}
          <div className="time-col" style={{ height: "100%" }}>
            {HOUR_TICKS.map((h) => {
              const pct = hourToPercent(h);
              if (pct < 0 || pct > 100) return null;
              return (
                <span
                  key={h}
                  className="time-label"
                  style={{ top: `${pct}%` }}
                >
                  {String(h).padStart(2, "0")}:00
                </span>
              );
            })}
          </div>

          {/* ── Day columns ── */}
          {DAYS.map((day, idx) => {
            const date     = getDateForDay(refDate, idx);
            const todayCol = isToday(date);
            const dayBlocks = weekBlocks.filter((b) => b.day === day);

            return (
              <div key={day} className="flex flex-col gap-0 min-w-0">
                {/* Day header */}
                <div
                  className={[
                    "day-header flex flex-col items-center justify-center py-1.5 px-1 mb-1",
                    "rounded-xl text-xs font-semibold select-none",
                    todayCol
                      ? "bg-indigo-600 text-white"
                      : "bg-white/70 text-slate-600 border border-slate-200/80",
                  ].join(" ")}
                >
                  <span className="uppercase tracking-wide">{day.slice(0, 3)}</span>
                  <span className={todayCol ? "text-indigo-100" : "text-slate-400"}>
                    {formatDayMonth(date)}
                  </span>
                </div>

                {/* Day grid */}
                <div
                  ref={idx === 0 ? gridRef : undefined}
                  className={[
                    "day-col relative",
                    !locked ? "edit-mode" : "",
                  ].join(" ")}
                  style={{ height: 640 }}
                  onClick={(e) => handleDayClick(e, day)}
                >
                  {/* Hour lines */}
                  {HOUR_TICKS.map((h) => {
                    const pct = hourToPercent(h);
                    if (pct < 0 || pct > 100) return null;
                    return (
                      <div
                        key={h}
                        className="hour-line"
                        style={{ top: `${pct}%` }}
                      />
                    );
                  })}

                  {/* Current time indicator */}
                  {curLineVisible && todayCol && (
                    <div
                      className="current-time-line"
                      style={{ top: curLineTop }}
                    />
                  )}

                  {/* Blocks */}
                  {dayBlocks.map((block) => (
                    <ScheduleBlock
                      key={block.id}
                      block={block}
                      weekKey={weekKey}
                      onPointerDown={(e) => startDrag(e, block.id, idx)}
                      onResizePointerDown={(edge, e) => startResize(e, block.id, edge)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
