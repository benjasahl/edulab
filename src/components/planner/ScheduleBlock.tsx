"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { Block, TYPES, FIXED_SCHEDULE_START, FIXED_SCHEDULE_END } from "@/types";
import { timeToMinutes } from "@/lib/dateUtils";

const TOTAL_MINS = (FIXED_SCHEDULE_END - FIXED_SCHEDULE_START) * 60;
const SCHED_START_MINS = FIXED_SCHEDULE_START * 60;

interface Props {
  block: Block;
  weekKey: string;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onResizePointerDown?: (edge: "top" | "bottom", e: React.PointerEvent<HTMLDivElement>) => void;
}

export default function ScheduleBlock({ block, onPointerDown, onResizePointerDown }: Props) {
  const subjects  = useAppStore((s) => s.data.subjects);
  const locked    = useAppStore((s) => s.data.ui.locked);
  const openBlockDialog = useAppStore((s) => s.openBlockDialog);

  const subject = subjects.find((s) => s.id === block.subjectId);
  const color =
    subject?.color ??
    TYPES.find((t) => t.value === block.type)?.color ??
    "#e5e7eb";

  const typeLabel = TYPES.find((t) => t.value === block.type)?.label ?? block.type;

  const startMins = timeToMinutes(block.start);
  const endMins   = timeToMinutes(block.end);

  const top    = ((startMins - SCHED_START_MINS) / TOTAL_MINS) * 100;
  const height = ((endMins - startMins) / TOTAL_MINS) * 100;

  // Clamp to visible range (defensive)
  const clampedTop    = Math.max(0, top);
  const clampedHeight = Math.min(height, 100 - clampedTop);

  const durationMins = endMins - startMins;
  const isCompact = durationMins < 30;
  const isMini    = durationMins < 20;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    openBlockDialog({ blockId: block.id });
  }

  // Determine a readable text color based on background lightness
  // Simple heuristic: use the background color hex to decide
  const textColor = "#0f172a";

  return (
    <div
      className={[
        "block",
        isCompact ? "block-compact" : "",
        isMini    ? "block-mini"    : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        top:        `${clampedTop}%`,
        height:     `${clampedHeight}%`,
        background: color,
        color:      textColor,
        borderRadius: 8,
        cursor:     locked ? "default" : "grab",
      }}
      onClick={handleClick}
    >
      {/* Top resize handle */}
      {!locked && (
        <div
          className="resize-handle"
          style={{ top: 0, bottom: "auto", background: "linear-gradient(to top, transparent, rgba(15,23,42,.08))", cursor: "ns-resize" }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizePointerDown?.("top", e);
          }}
        />
      )}

      {/* Block header — drag area */}
      <div
        className="block-header"
        onPointerDown={(e) => {
          if (!locked) onPointerDown?.(e);
        }}
      >
        <div className="block-title">
          {subject?.name && (
            <span className="block-title-subject" title={subject.name}>
              {subject.name}
            </span>
          )}
          {block.className && (
            <span className="block-title-class" style={{ opacity: 0.7 }}>
              {block.className}
            </span>
          )}
        </div>
        <span className="block-time">
          {block.start}–{block.end}
        </span>
      </div>

      {/* Block body */}
      {!isCompact && (
        <div className="block-body" style={{ pointerEvents: "none" }}>
          <div style={{ fontSize: 10, opacity: 0.65, fontWeight: 500 }}>
            {typeLabel}
          </div>
          {block.location && (
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 1 }}>
              {block.location}
            </div>
          )}
        </div>
      )}

      {/* Bottom resize handle */}
      {!locked && (
        <div
          className="resize-handle"
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizePointerDown?.("bottom", e);
          }}
        />
      )}
    </div>
  );
}
