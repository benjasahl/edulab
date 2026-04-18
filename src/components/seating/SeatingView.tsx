"use client";

import { useAppStore } from "@/store/useAppStore";
import { ExclusionRule } from "@/types";
import { generateGroups, resolveStudentNames } from "@/lib/groupGenerator";

const field = "flex flex-col gap-1.5";
const label = "text-xs font-semibold text-slate-500 uppercase tracking-wide";
const input = "border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500";

export default function SeatingView() {
  const classes = useAppStore((s) => s.data.classes);
  const seating = useAppStore((s) => s.data.seating);
  const activeClassId = useAppStore((s) => s.data.ui.activeClassId);

  const updateSeating = useAppStore((s) => s.updateSeating);
  const setSeatingGroups = useAppStore((s) => s.setSeatingGroups);
  const setActiveClassId = useAppStore((s) => s.setActiveClassId);

  const activeClass = classes.find((c) => c.id === activeClassId) ?? null;
  const students = activeClass?.students ?? [];
  const { mode, groupSize, groupCount, exclusions, groups } = seating;

  function handleClassChange(id: string) {
    setActiveClassId(id);
    setSeatingGroups([]);
    updateSeating({ exclusions: [] });
  }

  function handleGenerate() {
    if (!activeClass || students.length === 0) return;
    const result = generateGroups({ students, mode, groupSize, groupCount, exclusions });
    setSeatingGroups(result.groups);
  }

  function addExclusion() {
    updateSeating({ exclusions: [...exclusions, { rule: "", studentIds: [] }] });
  }

  function removeExclusion(idx: number) {
    updateSeating({ exclusions: exclusions.filter((_, i) => i !== idx) });
  }

  function updateExclusionRule(idx: number, rule: string) {
    updateSeating({ exclusions: exclusions.map((ex, i) => i === idx ? { ...ex, rule } : ex) });
  }

  function toggleExclusionStudent(idx: number, studentId: string) {
    const ex = exclusions[idx];
    const studentIds = ex.studentIds.includes(studentId)
      ? ex.studentIds.filter((id) => id !== studentId)
      : [...ex.studentIds, studentId];
    updateSeating({ exclusions: exclusions.map((e, i) => i === idx ? ({ ...e, studentIds } as ExclusionRule) : e) });
  }

  if (classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Lägg till klasser i Klasser-vyn för att använda gruppgeneratorn.
      </div>
    );
  }

  return (
    <div className="view-scroll-inner flex flex-col gap-6">
      {/* Class selector */}
      <div className={field}>
        <label className={label}>Klass</label>
        <select
          className={input}
          value={activeClassId}
          onChange={(e) => handleClassChange(e.target.value)}
        >
          <option value="">Välj klass...</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.students.length} elever)
            </option>
          ))}
        </select>
      </div>

      {activeClass && (
        <>
          {/* Mode */}
          <div className={field}>
            <span className={label}>Metod</span>
            <div className="flex gap-6 pt-1">
              {(["size", "count"] as const).map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 font-medium">
                  <input
                    type="radio"
                    name="seating-mode"
                    value={m}
                    checked={mode === m}
                    onChange={() => updateSeating({ mode: m })}
                    className="accent-orange-500 w-4 h-4"
                  />
                  {m === "size" ? "Gruppstorlek" : "Antal grupper"}
                </label>
              ))}
            </div>
          </div>

          {/* Size / count input */}
          <div className={field} style={{ maxWidth: 200 }}>
            <label className={label}>
              {mode === "size" ? "Elever per grupp" : "Antal grupper"}
            </label>
            <input
              type="number"
              min={2}
              max={students.length || 30}
              className={input}
              value={mode === "size" ? groupSize : groupCount}
              onChange={(e) => {
                const v = Math.max(2, parseInt(e.target.value) || 2);
                updateSeating(mode === "size" ? { groupSize: v } : { groupCount: v });
              }}
            />
          </div>

          {/* Exclusion rules */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className={label}>Exkluderingsregler</span>
              <button
                onClick={addExclusion}
                className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                + Lägg till regel
              </button>
            </div>

            {exclusions.length === 0 && (
              <p className="text-sm text-slate-400">Inga regler — elever kan hamna i valfri grupp.</p>
            )}

            {exclusions.map((ex, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-3 bg-slate-50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className={`flex-1 ${input}`}
                    placeholder="Regeltext (t.ex. Ska inte sitta ihop)"
                    value={ex.rule}
                    onChange={(e) => updateExclusionRule(idx, e.target.value)}
                  />
                  <button
                    onClick={() => removeExclusion(idx)}
                    className="text-slate-400 hover:text-red-500 transition-colors text-xs font-semibold whitespace-nowrap"
                  >
                    Ta bort
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {students.length === 0 && (
                    <span className="text-xs text-slate-400">Inga elever i klassen.</span>
                  )}
                  {students.map((st) => {
                    const selected = ex.studentIds.includes(st.id);
                    return (
                      <button
                        key={st.id}
                        onClick={() => toggleExclusionStudent(idx, st.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                          selected
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-slate-600 border-slate-200 hover:border-orange-400"
                        }`}
                      >
                        {st.firstName} {st.lastName}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Generate */}
          <div>
            <button
              onClick={handleGenerate}
              disabled={students.length === 0}
              className="bg-orange-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Generera grupper
            </button>
          </div>

          {/* Results */}
          {groups.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className={label}>{groups.length} grupper</span>
              <div className="flex flex-wrap gap-3">
                {groups.map((groupIds, gIdx) => {
                  const names = resolveStudentNames(groupIds, students);
                  return (
                    <div key={gIdx} className="bg-white border border-slate-200 rounded-xl p-4 min-w-36 shadow-sm">
                      <p className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wide">
                        Grupp {gIdx + 1}
                      </p>
                      <ul className="flex flex-col gap-0.5">
                        {names.map((name, nIdx) => (
                          <li key={nIdx} className="text-sm text-slate-700">{name}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
