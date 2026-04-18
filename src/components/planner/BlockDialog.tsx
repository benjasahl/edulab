"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { DAYS, TYPES, Day, BlockType } from "@/types";
import { getWeekKey, getReferenceDate } from "@/lib/dateUtils";

export default function BlockDialog() {
  const open = useAppStore((s) => s.dialogs.blockDialog.open);
  const blockId = useAppStore((s) => s.dialogs.blockDialog.blockId);
  const dialogDay = useAppStore((s) => s.dialogs.blockDialog.day);
  const dialogStart = useAppStore((s) => s.dialogs.blockDialog.start);
  const dialogEnd = useAppStore((s) => s.dialogs.blockDialog.end);
  const blocks = useAppStore((s) => s.data.blocks);
  const subjects = useAppStore((s) => s.data.subjects);
  const weekOffset = useAppStore((s) => s.data.ui.weekOffset);
  const selectedDate = useAppStore((s) => s.data.ui.selectedDate);

  const addBlock = useAppStore((s) => s.addBlock);
  const updateBlock = useAppStore((s) => s.updateBlock);
  const deleteBlock = useAppStore((s) => s.deleteBlock);
  const deleteBlockSeries = useAppStore((s) => s.deleteBlockSeries);
  const deleteBlockAllDays = useAppStore((s) => s.deleteBlockAllDays);
  const closeBlockDialog = useAppStore((s) => s.closeBlockDialog);

  const [type, setType] = useState<BlockType>("lektion");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [day, setDay] = useState<Day>("Måndag");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("09:00");
  const [className, setClassName] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const existingBlock = blockId ? blocks.find((b) => b.id === blockId) : null;

  useEffect(() => {
    if (!open) return;
    if (existingBlock) {
      setType(existingBlock.type);
      setSubjectId(existingBlock.subjectId);
      setTitle(existingBlock.title);
      setDay(existingBlock.day);
      setStart(existingBlock.start);
      setEnd(existingBlock.end);
      setClassName(existingBlock.className);
      setLocation(existingBlock.location);
      setNotes(existingBlock.notes);
    } else {
      setType("lektion");
      setSubjectId("");
      setTitle("");
      setDay(dialogDay ?? "Måndag");
      setStart(dialogStart ?? "08:00");
      setEnd(dialogEnd ?? "09:00");
      setClassName("");
      setLocation("");
      setNotes("");
    }
  }, [open, blockId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  const sortedSubjects = [...subjects].sort((a, b) =>
    a.name.localeCompare(b.name, "sv")
  );

  const refDate = getReferenceDate(weekOffset, selectedDate);
  const weekKey = getWeekKey(refDate);

  function handleSave() {
    if (blockId && existingBlock) {
      updateBlock(blockId, { type, subjectId, title, day, start, end, className, location, notes });
    } else {
      addBlock({
        day,
        type,
        start,
        end,
        subjectId,
        className,
        location,
        notes,
        title,
        linkedSubjectIds: [],
        seriesId: "",
        weekKey,
        excludedWeekKeys: [],
        notesByWeek: {},
      });
    }
    closeBlockDialog();
  }

  function handleDeleteSingle() {
    if (blockId) {
      deleteBlock(blockId);
      closeBlockDialog();
    }
  }

  function handleDeleteSeries() {
    if (existingBlock?.seriesId) {
      deleteBlockSeries(existingBlock.seriesId);
      closeBlockDialog();
    }
  }

  function handleDeleteAllDays() {
    if (existingBlock?.seriesId) {
      deleteBlockAllDays(existingBlock.seriesId, existingBlock.weekKey);
      closeBlockDialog();
    }
  }

  const inputClass =
    "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          {blockId ? "Redigera block" : "Nytt block"}
        </h2>

        <div className="space-y-3">
          {/* Type */}
          <div>
            <label className={labelClass}>Typ</label>
            <select
              className={inputClass}
              value={type}
              onChange={(e) => setType(e.target.value as BlockType)}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className={labelClass}>Ämne</label>
            <select
              className={inputClass}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">(inget ämne)</option>
              {sortedSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className={labelClass}>Titel (valfritt)</label>
            <input
              type="text"
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Fritext rubrik"
            />
          </div>

          {/* Day */}
          <div>
            <label className={labelClass}>Dag</label>
            <select
              className={inputClass}
              value={day}
              onChange={(e) => setDay(e.target.value as Day)}
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Starttid</label>
              <input
                type="time"
                className={inputClass}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Sluttid</label>
              <input
                type="time"
                className={inputClass}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>

          {/* Class */}
          <div>
            <label className={labelClass}>Klass/grupp</label>
            <input
              type="text"
              className={inputClass}
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="T.ex. 7A"
            />
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>Plats</label>
            <input
              type="text"
              className={inputClass}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="T.ex. sal 204"
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Anteckningar</label>
            <textarea
              className={inputClass}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fritext..."
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={handleSave}
            className="bg-orange-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-orange-700 transition-colors"
          >
            Spara
          </button>
          <button
            onClick={closeBlockDialog}
            className="bg-transparent border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Stäng
          </button>

          {blockId && (
            <>
              <button
                onClick={handleDeleteSingle}
                className="bg-red-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-red-700 transition-colors"
              >
                Ta bort
              </button>
              {existingBlock?.seriesId && (
                <>
                  <button
                    onClick={handleDeleteAllDays}
                    className="bg-red-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Ta bort alla (denna vecka)
                  </button>
                  <button
                    onClick={handleDeleteSeries}
                    className="bg-red-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Ta bort alla (serie)
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
