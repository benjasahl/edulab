"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Day, DAYS } from "@/types";
import {
  timeToMinutes,
  minutesToTime,
  snapToFive,
  clamp,
} from "@/lib/dateUtils";

// ─── Block drag ───────────────────────────────────────────────────────────────

export interface DragState {
  blockId: string;
  dayIndex: number;
  offsetMinutes: number;
  startMouseY: number;
  startMouseX: number;
  originalStart: string;
  originalEnd: string;
  originalDay: Day;
}

export interface ResizeState {
  blockId: string;
  edge: "top" | "bottom";
  originalStart: string;
  originalEnd: string;
  startMouseY: number;
}

export function useDragDrop(
  scheduleStart: number,
  scheduleEnd: number,
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const updateBlock = useAppStore((s) => s.updateBlock);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);

  const pixelsPerMinute = useCallback(() => {
    if (!containerRef.current) return 0;
    const totalMinutes = (scheduleEnd - scheduleStart) * 60;
    return containerRef.current.clientHeight / totalMinutes;
  }, [containerRef, scheduleStart, scheduleEnd]);

  const startDrag = useCallback(
    (e: React.PointerEvent, blockId: string, dayIndex: number) => {
      const block = useAppStore.getState().data.blocks.find((b) => b.id === blockId);
      if (!block) return;
      e.preventDefault();
      e.stopPropagation();
      const startMinutes = timeToMinutes(block.start);
      const scheduleStartMinutes = scheduleStart * 60;
      const ppm = pixelsPerMinute();
      if (ppm === 0) return;
      const offsetMinutes = (e.clientY - e.currentTarget.getBoundingClientRect().top) / ppm;

      dragRef.current = {
        blockId,
        dayIndex,
        offsetMinutes,
        startMouseY: e.clientY,
        startMouseX: e.clientX,
        originalStart: block.start,
        originalEnd: block.end,
        originalDay: block.day,
      };

      const duration = timeToMinutes(block.end) - startMinutes;

      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current || !containerRef.current) return;
        const grid = containerRef.current;
        const gridRect = grid.getBoundingClientRect();
        const totalMinutes = (scheduleEnd - scheduleStart) * 60;
        const ppm = grid.clientHeight / totalMinutes;

        const relY = ev.clientY - gridRect.top;
        const newStartMinutes = snapToFive(
          clamp(
            scheduleStartMinutes + relY / ppm - dragRef.current.offsetMinutes,
            scheduleStartMinutes,
            scheduleEnd * 60 - duration
          )
        );
        const newEndMinutes = newStartMinutes + duration;

        // Determine day from X position
        const dayColumns = grid.querySelectorAll<HTMLElement>(".day-col");
        let newDayIndex = dayIndex;
        dayColumns.forEach((col, i) => {
          const rect = col.getBoundingClientRect();
          if (ev.clientX >= rect.left && ev.clientX <= rect.right) {
            newDayIndex = i;
          }
        });

        updateBlock(blockId, {
          start: minutesToTime(newStartMinutes),
          end: minutesToTime(newEndMinutes),
          day: DAYS[newDayIndex],
        });
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [pixelsPerMinute, scheduleStart, scheduleEnd, updateBlock, containerRef]
  );

  const startResize = useCallback(
    (e: React.PointerEvent, blockId: string, edge: "top" | "bottom") => {
      const block = useAppStore.getState().data.blocks.find((b) => b.id === blockId);
      if (!block) return;
      e.preventDefault();
      e.stopPropagation();

      resizeRef.current = {
        blockId,
        edge,
        originalStart: block.start,
        originalEnd: block.end,
        startMouseY: e.clientY,
      };

      const onMove = (ev: PointerEvent) => {
        if (!resizeRef.current || !containerRef.current) return;
        const { blockId, edge, originalStart, originalEnd, startMouseY } =
          resizeRef.current;
        const grid = containerRef.current;
        const totalMinutes = (scheduleEnd - scheduleStart) * 60;
        const ppm = grid.clientHeight / totalMinutes;
        const deltaMinutes = (ev.clientY - startMouseY) / ppm;
        const scheduleStartMinutes = scheduleStart * 60;
        const scheduleEndMinutes = scheduleEnd * 60;

        if (edge === "bottom") {
          const origEndMinutes = timeToMinutes(originalEnd);
          const newEndMinutes = snapToFive(
            clamp(origEndMinutes + deltaMinutes, timeToMinutes(originalStart) + 15, scheduleEndMinutes)
          );
          updateBlock(blockId, { end: minutesToTime(newEndMinutes) });
        } else {
          const origStartMinutes = timeToMinutes(originalStart);
          const newStartMinutes = snapToFive(
            clamp(origStartMinutes + deltaMinutes, scheduleStartMinutes, timeToMinutes(originalEnd) - 15)
          );
          updateBlock(blockId, { start: minutesToTime(newStartMinutes) });
        }
      };

      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [containerRef, scheduleStart, scheduleEnd, updateBlock]
  );

  return { startDrag, startResize };
}
