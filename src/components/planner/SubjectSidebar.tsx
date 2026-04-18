"use client";

import { useAppStore } from "@/store/useAppStore";

export default function SubjectSidebar() {
  const subjects          = useAppStore((s) => s.data.subjects);
  const locked            = useAppStore((s) => s.data.ui.locked);
  const openSubjectDialog = useAppStore((s) => s.openSubjectDialog);

  const sorted = [...subjects].sort((a, b) =>
    new Intl.Collator("sv").compare(a.name, b.name)
  );

  return (
    <div className="panel flex flex-col gap-2 h-full min-h-0 overflow-y-auto p-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Ämnen
        </span>
        <button
          onClick={() => openSubjectDialog(null)}
          title="Nytt ämne"
          className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      {/* Subject list */}
      <div className="flex flex-col gap-1 flex-1 min-h-0">
        {sorted.length === 0 && (
          <p className="muted small text-center py-6">
            Inga ämnen ännu
          </p>
        )}

        {sorted.map((subject) => (
          <button
            key={subject.id}
            onClick={() => openSubjectDialog(subject.id)}
            disabled={locked}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-left w-full transition-colors group disabled:opacity-60 disabled:cursor-default"
          >
            {/* Color swatch */}
            <span
              className="w-4 h-4 rounded flex-none border border-black/10 shadow-sm"
              style={{ background: subject.color }}
            />

            {/* Subject name */}
            <span className="flex-1 min-w-0 text-sm font-medium text-slate-700 truncate">
              {subject.name || <span className="text-slate-400 italic">Namnlöst</span>}
            </span>

            {/* Edit icon — visible on hover */}
            {!locked && (
              <svg
                className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 flex-none transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Footer: "Nytt ämne" button */}
      {!locked && (
        <button
          onClick={() => openSubjectDialog(null)}
          className="mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nytt ämne
        </button>
      )}
    </div>
  );
}
