"use client";

import { useAppStore } from "@/store/useAppStore";
import { ExclusionRule } from "@/types";
import { generateGroups, resolveStudentNames } from "@/lib/groupGenerator";

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

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleClassChange(id: string) {
    setActiveClassId(id);
    // Reset groups when class changes
    setSeatingGroups([]);
    updateSeating({ exclusions: [] });
  }

  function handleGenerate() {
    if (!activeClass || students.length === 0) return;
    const result = generateGroups({
      students,
      mode,
      groupSize,
      groupCount,
      exclusions,
    });
    setSeatingGroups(result.groups);
  }

  function addExclusion() {
    updateSeating({
      exclusions: [...exclusions, { rule: "", studentIds: [] }],
    });
  }

  function removeExclusion(idx: number) {
    const next = exclusions.filter((_, i) => i !== idx);
    updateSeating({ exclusions: next });
  }

  function updateExclusionRule(idx: number, rule: string) {
    const next = exclusions.map((ex, i) =>
      i === idx ? { ...ex, rule } : ex
    );
    updateSeating({ exclusions: next });
  }

  function toggleExclusionStudent(idx: number, studentId: string) {
    const ex = exclusions[idx];
    const studentIds = ex.studentIds.includes(studentId)
      ? ex.studentIds.filter((id) => id !== studentId)
      : [...ex.studentIds, studentId];
    const next = exclusions.map((e, i) =>
      i === idx ? ({ ...e, studentIds } as ExclusionRule) : e
    );
    updateSeating({ exclusions: next });
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const inputClass =
    "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";

  // ── Empty state ───────────────────────────────────────────────────────────

  if (classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        Lägg till klasser i Klasser-vyn för att använda gruppgeneratorn.
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl space-y-6">
      {/* ── Class selector ── */}
      <div>
        <label className={labelClass}>Klass</label>
        <select
          className={inputClass}
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
          {/* ── Mode selector ── */}
          <div>
            <label className={labelClass}>Metod</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="radio"
                  name="seating-mode"
                  value="size"
                  checked={mode === "size"}
                  onChange={() => updateSeating({ mode: "size" })}
                  className="accent-orange-600"
                />
                Gruppstorlek
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="radio"
                  name="seating-mode"
                  value="count"
                  checked={mode === "count"}
                  onChange={() => updateSeating({ mode: "count" })}
                  className="accent-orange-600"
                />
                Antal grupper
              </label>
            </div>
          </div>

          {/* ── Group size / count input ── */}
          {mode === "size" ? (
            <div>
              <label className={labelClass}>Gruppstorlek (antal elever per grupp)</label>
              <input
                type="number"
                min={2}
                max={students.length}
                className={inputClass}
                value={groupSize}
                onChange={(e) =>
                  updateSeating({ groupSize: Math.max(2, parseInt(e.target.value) || 2) })
                }
              />
            </div>
          ) : (
            <div>
              <label className={labelClass}>Antal grupper</label>
              <input
                type="number"
                min={2}
                max={students.length}
                className={inputClass}
                value={groupCount}
                onChange={(e) =>
                  updateSeating({ groupCount: Math.max(2, parseInt(e.target.value) || 2) })
                }
              />
            </div>
          )}

          {/* ── Exclusion rules ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                Exkluderingsregler
              </span>
              <button
                onClick={addExclusion}
                className="bg-transparent border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors text-xs"
              >
                + Lägg till regel
              </button>
            </div>

            {exclusions.length === 0 && (
              <p className="text-xs text-slate-400">
                Inga regler — elever kan hamna i valfri grupp.
              </p>
            )}

            {exclusions.map((ex, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Regeltext (t.ex. Ska inte sitta ihop)"
                    value={ex.rule}
                    onChange={(e) => updateExclusionRule(idx, e.target.value)}
                  />
                  <button
                    onClick={() => removeExclusion(idx)}
                    className="bg-red-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-red-700 transition-colors text-xs"
                  >
                    Ta bort
                  </button>
                </div>

                {/* Student multiselect */}
                <div className="flex flex-wrap gap-1.5">
                  {students.map((st) => {
                    const selected = ex.studentIds.includes(st.id);
                    return (
                      <button
                        key={st.id}
                        onClick={() => toggleExclusionStudent(idx, st.id)}
                        className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                          selected
                            ? "bg-orange-600 text-white border-orange-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-orange-400"
                        }`}
                      >
                        {st.firstName} {st.lastName}
                      </button>
                    );
                  })}
                  {students.length === 0 && (
                    <span className="text-xs text-slate-400">
                      Inga elever i klassen.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Generate button ── */}
          <button
            onClick={handleGenerate}
            disabled={students.length === 0}
            className="bg-orange-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generera grupper
          </button>

          {/* ── Generated groups ── */}
          {groups.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Genererade grupper ({groups.length} st)
              </h3>
              <div className="flex flex-wrap gap-4">
                {groups.map((groupIds, gIdx) => {
                  const names = resolveStudentNames(groupIds, students);
                  return (
                    <div
                      key={gIdx}
                      className="bg-white border border-slate-200 rounded-xl p-3 min-w-[140px] shadow-sm"
                    >
                      <p className="text-xs font-bold text-orange-700 mb-2">
                        Grupp {gIdx + 1}
                      </p>
                      <ul className="space-y-0.5">
                        {names.map((name, nIdx) => (
                          <li key={nIdx} className="text-xs text-slate-700">
                            {name}
                          </li>
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
