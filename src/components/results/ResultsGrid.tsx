"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ResultsSet } from "@/types";
import { calculateAverage, getGradeFromAverage } from "@/lib/results";

// Grade colour map: A=5, B=4, C=3, D=2, E=1, F=0
const GRADE_COLORS: Record<string, string> = {
  A: "#dcfce7",
  B: "#bbf7d0",
  C: "#fef9c3",
  D: "#fed7aa",
  E: "#fecaca",
  F: "#f87171",
};

function cellBg(value: string): string {
  if (!value) return "#ffffff";
  const upper = value.toUpperCase().trim();
  return GRADE_COLORS[upper] ?? "#ffffff";
}

interface EditingCell {
  studentIdx: number;
  areaIdx: number;
}

interface Props {
  resultsSet: ResultsSet;
}

export default function ResultsGrid({ resultsSet }: Props) {
  const setResultValue = useAppStore((s) => s.setResultValue);
  const addResultsStudent = useAppStore((s) => s.addResultsStudent);
  const addResultsArea = useAppStore((s) => s.addResultsArea);
  const updateResultsStudent = useAppStore((s) => s.updateResultsStudent);
  const updateResultsArea = useAppStore((s) => s.updateResultsArea);
  const deleteResultsStudent = useAppStore((s) => s.deleteResultsStudent);
  const deleteResultsArea = useAppStore((s) => s.deleteResultsArea);

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [cellDraft, setCellDraft] = useState("");

  const [editingStudentIdx, setEditingStudentIdx] = useState<number | null>(null);
  const [studentDraft, setStudentDraft] = useState("");

  const [editingAreaIdx, setEditingAreaIdx] = useState<number | null>(null);
  const [areaDraft, setAreaDraft] = useState("");

  const { id: setId, students, areas, values } = resultsSet;

  function cellKey(areaIdx: number, studentIdx: number) {
    return `${areaIdx}::${studentIdx}`;
  }

  function openCell(studentIdx: number, areaIdx: number) {
    const key = cellKey(areaIdx, studentIdx);
    setCellDraft(values[key] ?? "");
    setEditingCell({ studentIdx, areaIdx });
  }

  function commitCell() {
    if (!editingCell) return;
    const { studentIdx, areaIdx } = editingCell;
    setResultValue(setId, cellKey(areaIdx, studentIdx), cellDraft.toUpperCase().trim());
    setEditingCell(null);
  }

  function openStudentEdit(idx: number) {
    setStudentDraft(students[idx]);
    setEditingStudentIdx(idx);
  }

  function commitStudent() {
    if (editingStudentIdx === null) return;
    if (studentDraft.trim()) {
      updateResultsStudent(setId, editingStudentIdx, studentDraft.trim());
    }
    setEditingStudentIdx(null);
  }

  function openAreaEdit(idx: number) {
    setAreaDraft(areas[idx]);
    setEditingAreaIdx(idx);
  }

  function commitArea() {
    if (editingAreaIdx === null) return;
    if (areaDraft.trim()) {
      updateResultsArea(setId, editingAreaIdx, areaDraft.trim());
    }
    setEditingAreaIdx(null);
  }

  const thClass =
    "px-2 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 whitespace-nowrap";
  const tdClass =
    "px-2 py-1 text-xs border border-slate-200 text-center cursor-pointer select-none";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-800">
          {resultsSet.subject}
          {resultsSet.className && (
            <span className="ml-2 text-sm font-normal text-slate-500">
              {resultsSet.className}
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => addResultsStudent(setId, `Elev ${students.length + 1}`)}
            className="bg-transparent border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors text-xs"
          >
            + Elev
          </button>
          <button
            onClick={() => addResultsArea(setId, `Område ${areas.length + 1}`)}
            className="bg-transparent border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors text-xs"
          >
            + Område
          </button>
        </div>
      </div>

      {students.length === 0 && areas.length === 0 ? (
        <p className="text-sm text-slate-400">
          Lägg till elever och bedömningsområden för att börja.
        </p>
      ) : (
        <div className="overflow-auto">
          <table className="results-grid border-collapse text-sm">
            <thead>
              <tr>
                {/* Top-left corner cell */}
                <th className={`${thClass} text-left`}>Elev</th>

                {/* Area headers */}
                {areas.map((area, aIdx) => (
                  <th key={aIdx} className={thClass}>
                    {editingAreaIdx === aIdx ? (
                      <input
                        autoFocus
                        className="w-24 border border-orange-400 rounded px-1 py-0.5 text-xs focus:outline-none"
                        value={areaDraft}
                        onChange={(e) => setAreaDraft(e.target.value)}
                        onBlur={commitArea}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitArea();
                          if (e.key === "Escape") setEditingAreaIdx(null);
                        }}
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-orange-600"
                        onClick={() => openAreaEdit(aIdx)}
                        title="Klicka för att redigera"
                      >
                        {area}
                      </span>
                    )}
                    <button
                      onClick={() => deleteResultsArea(setId, aIdx)}
                      className="ml-1 text-slate-300 hover:text-red-500 text-xs"
                      title="Ta bort område"
                    >
                      ×
                    </button>
                  </th>
                ))}

                {/* Snitt column header */}
                {areas.length > 0 && (
                  <th className={`${thClass} bg-slate-100`}>Snitt</th>
                )}
              </tr>
            </thead>

            <tbody>
              {students.map((student, sIdx) => {
                // Compute per-student average across all areas
                const rowValues = areas.map((_, aIdx) => values[cellKey(aIdx, sIdx)] ?? "");
                const avg = calculateAverage(rowValues);
                const avgGrade = getGradeFromAverage(avg);

                return (
                  <tr key={sIdx} className="hover:bg-slate-50">
                    {/* Student name cell */}
                    <td className={`${tdClass} text-left`}>
                      <div className="flex items-center gap-1">
                        {editingStudentIdx === sIdx ? (
                          <input
                            autoFocus
                            className="w-28 border border-orange-400 rounded px-1 py-0.5 text-xs focus:outline-none"
                            value={studentDraft}
                            onChange={(e) => setStudentDraft(e.target.value)}
                            onBlur={commitStudent}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitStudent();
                              if (e.key === "Escape") setEditingStudentIdx(null);
                            }}
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-orange-600"
                            onClick={() => openStudentEdit(sIdx)}
                            title="Klicka för att redigera"
                          >
                            {student}
                          </span>
                        )}
                        <button
                          onClick={() => deleteResultsStudent(setId, sIdx)}
                          className="text-slate-300 hover:text-red-500 text-xs flex-none"
                          title="Ta bort elev"
                        >
                          ×
                        </button>
                      </div>
                    </td>

                    {/* Grade cells */}
                    {areas.map((_, aIdx) => {
                      const key = cellKey(aIdx, sIdx);
                      const val = values[key] ?? "";
                      const isEditing =
                        editingCell?.studentIdx === sIdx && editingCell?.areaIdx === aIdx;

                      return (
                        <td
                          key={aIdx}
                          className={`${tdClass} results-cell-${Math.max(0, Math.min(5, Math.round(parseFloat(val) || 0)))}`}
                          style={{ backgroundColor: cellBg(val) }}
                          onClick={() => !isEditing && openCell(sIdx, aIdx)}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              className="w-12 text-center border border-orange-400 rounded px-1 py-0.5 text-xs focus:outline-none bg-white"
                              value={cellDraft}
                              onChange={(e) => setCellDraft(e.target.value)}
                              onBlur={commitCell}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitCell();
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                            />
                          ) : (
                            <span>{val}</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Row average */}
                    {areas.length > 0 && (
                      <td
                        className={`${tdClass} font-semibold bg-slate-50`}
                        style={{ backgroundColor: cellBg(avgGrade) }}
                      >
                        {avgGrade}
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* Average row */}
              {students.length > 0 && areas.length > 0 && (
                <tr className="bg-slate-100 font-semibold">
                  <td className={`${tdClass} text-left text-slate-500`}>Snitt</td>
                  {areas.map((_, aIdx) => {
                    const colValues = students.map(
                      (__, sIdx) => values[cellKey(aIdx, sIdx)] ?? ""
                    );
                    const avg = calculateAverage(colValues);
                    const grade = getGradeFromAverage(avg);
                    return (
                      <td
                        key={aIdx}
                        className={tdClass}
                        style={{ backgroundColor: cellBg(grade) }}
                      >
                        {grade}
                      </td>
                    );
                  })}
                  <td className={`${tdClass} bg-slate-200`} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
