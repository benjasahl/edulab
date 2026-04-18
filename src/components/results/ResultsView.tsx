"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import ResultsGrid from "./ResultsGrid";

export default function ResultsView() {
  const resultsSets = useAppStore((s) => s.data.resultsSets);
  const activeResultsSetId = useAppStore((s) => s.data.ui.activeResultsSetId);
  const classes = useAppStore((s) => s.data.classes);
  const resultsDeletePendingId = useAppStore((s) => s.dialogs.resultsDeletePendingId);

  const setActiveResultsSetId = useAppStore((s) => s.setActiveResultsSetId);
  const addResultsSet = useAppStore((s) => s.addResultsSet);
  const deleteResultsSet = useAppStore((s) => s.deleteResultsSet);
  const setResultsDeletePending = useAppStore((s) => s.setResultsDeletePending);

  // New results set form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newClassId, setNewClassId] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");

  const sortedSets = [...resultsSets].sort((a, b) =>
    a.subject.localeCompare(b.subject, "sv")
  );

  const activeSet = resultsSets.find((r) => r.id === activeResultsSetId) ?? null;

  function handleCreateSet() {
    if (!newSubject.trim()) return;
    const cls = classes.find((c) => c.id === newClassId);
    addResultsSet({
      subject: newSubject.trim(),
      className: cls?.name ?? "",
      classId: newClassId,
      color: newColor,
      students: [],
      areas: [],
      values: {},
    });
    setNewSubject("");
    setNewClassId("");
    setNewColor("#6366f1");
    setShowNewForm(false);
  }

  function handleTrashClick(id: string) {
    if (resultsDeletePendingId === id) {
      deleteResultsSet(id);
      setResultsDeletePending("");
      if (activeResultsSetId === id) setActiveResultsSetId("");
    } else {
      setResultsDeletePending(id);
    }
  }

  const inputClass =
    "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="flex flex-row h-full min-h-0">
      {/* ── Sidebar ── */}
      <div className="w-56 flex-none border-r border-slate-200 flex flex-col">
        <div className="p-3 border-b border-slate-200">
          <button
            onClick={() => setShowNewForm((v) => !v)}
            className="w-full bg-indigo-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
          >
            {showNewForm ? "Avbryt" : "+ Nytt resultatset"}
          </button>
        </div>

        {/* New set form */}
        {showNewForm && (
          <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50">
            <input
              type="text"
              className={inputClass}
              placeholder="Ämnesnamn"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <select
              className={inputClass}
              value={newClassId}
              onChange={(e) => setNewClassId(e.target.value)}
            >
              <option value="">Välj klass</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 flex-none">Färg</label>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-8 w-12 rounded border border-slate-200 cursor-pointer"
              />
            </div>
            <button
              onClick={handleCreateSet}
              className="w-full bg-indigo-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm"
            >
              Skapa
            </button>
          </div>
        )}

        {/* Results set list */}
        <ul className="flex-1 overflow-y-auto py-1">
          {sortedSets.map((rs) => {
            const isActive = rs.id === activeResultsSetId;
            const isPendingDelete = resultsDeletePendingId === rs.id;
            return (
              <li
                key={rs.id}
                onClick={() => {
                  setActiveResultsSetId(rs.id);
                  setResultsDeletePending("");
                }}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {/* Color swatch */}
                <span
                  className="w-3 h-3 rounded-full flex-none border border-black/10"
                  style={{ backgroundColor: rs.color }}
                />
                <span className="flex-1 min-w-0 truncate">
                  {rs.subject}
                  {rs.className ? (
                    <span className="text-slate-400 font-normal ml-1 text-xs">
                      {rs.className}
                    </span>
                  ) : null}
                </span>
                {/* Trash button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrashClick(rs.id);
                  }}
                  title={isPendingDelete ? "Klicka igen för att bekräfta" : "Ta bort"}
                  className={`flex-none text-xs px-1.5 py-0.5 rounded transition-colors ${
                    isPendingDelete
                      ? "bg-red-600 text-white"
                      : "text-slate-400 hover:text-red-500"
                  }`}
                >
                  {isPendingDelete ? "!" : "🗑"}
                </button>
              </li>
            );
          })}
          {sortedSets.length === 0 && (
            <li className="px-3 py-4 text-xs text-slate-400 text-center">
              Inga resultatset ännu
            </li>
          )}
        </ul>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 min-w-0 overflow-auto p-4">
        {activeSet ? (
          <ResultsGrid resultsSet={activeSet} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Välj ett resultatset i sidopanelen eller skapa ett nytt.
          </div>
        )}
      </div>
    </div>
  );
}
