"use client";

import { useAppStore } from "@/store/useAppStore";
import type { TopView } from "@/types";

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS: { key: TopView; label: string }[] = [
  { key: "planner", label: "Planeraren" },
  { key: "results", label: "Resultat" },
  { key: "seating", label: "Sittplan" },
  { key: "classes", label: "Klasser" },
  { key: "links", label: "Snabblänkar" },
];

// ─── TopTabs ──────────────────────────────────────────────────────────────────

export default function TopTabs() {
  const topView = useAppStore((s) => s.data.ui.topView);
  const setTopView = useAppStore((s) => s.setTopView);

  return (
    <nav className="flex gap-1 p-1.5 bg-white/70 border border-slate-200 rounded-2xl shadow-sm backdrop-blur-sm">
      {TABS.map((tab) => {
        const isActive = topView === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setTopView(tab.key)}
            className={
              isActive
                ? "bg-orange-600 text-white shadow-md font-bold px-4 py-1.5 rounded-xl text-sm transition-all"
                : "text-slate-600 font-medium px-4 py-1.5 rounded-xl text-sm hover:bg-slate-100 transition-all"
            }
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
