"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function SubjectDialog() {
  const open      = useAppStore((s) => s.dialogs.subjectDialog.open);
  const subjectId = useAppStore((s) => s.dialogs.subjectDialog.subjectId);
  const subjects  = useAppStore((s) => s.data.subjects);

  const addSubject    = useAppStore((s) => s.addSubject);
  const updateSubject = useAppStore((s) => s.updateSubject);
  const deleteSubject = useAppStore((s) => s.deleteSubject);
  const closeSubjectDialog = useAppStore((s) => s.closeSubjectDialog);

  const [name,  setName]  = useState("");
  const [color, setColor] = useState("#a5f3fc");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const existing = subjectId ? subjects.find((s) => s.id === subjectId) : null;

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    if (existing) {
      setName(existing.name);
      setColor(existing.color);
    } else {
      setName("");
      setColor("#a5f3fc");
    }
  }, [open, subjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  function handleSave() {
    if (!name.trim()) return;
    if (subjectId && existing) {
      updateSubject(subjectId, { name: name.trim(), color });
    } else {
      addSubject({
        name: name.trim(),
        color,
        planned: false,
        linkedBlockIds: [],
        panelHeight: 120,
        notesByWeek: {},
        plannedByWeek: {},
      });
    }
    closeSubjectDialog();
  }

  function handleDelete() {
    if (!subjectId) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteSubject(subjectId);
    closeSubjectDialog();
  }

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          {subjectId ? "Redigera ämne" : "Nytt ämne"}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Namn</label>
            <input
              type="text"
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Matematik"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Färg</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-14 rounded-lg border border-slate-200 cursor-pointer p-0.5"
              />
              <span
                className="flex-1 h-9 rounded-xl border border-black/10 shadow-sm"
                style={{ background: color }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="bg-orange-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            Spara
          </button>
          <button
            onClick={closeSubjectDialog}
            className="border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Avbryt
          </button>
          {subjectId && (
            <button
              onClick={handleDelete}
              className={`ml-auto font-semibold px-4 py-2 rounded-xl transition-colors ${
                confirmDelete
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "border border-red-200 text-red-600 hover:bg-red-50"
              }`}
            >
              {confirmDelete ? "Bekräfta ta bort" : "Ta bort"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
