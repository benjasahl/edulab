"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useSync } from "@/hooks/useSync";
import BootOverlay from "@/components/BootOverlay";
import TopTabs from "@/components/TopTabs";
import AuthBar from "@/components/AuthBar";
import PlannerView from "@/components/planner/PlannerView";
import ResultsView from "@/components/results/ResultsView";
import SeatingView from "@/components/seating/SeatingView";
import ClassesView from "@/components/classes/ClassesView";
import LinksView from "@/components/links/LinksView";

export default function AppShell() {
  const { initState } = useAppStore();
  const topView = useAppStore((s) => s.data.ui.topView);
  const cloudSync = useAppStore((s) => s.cloudSync);

  // Initialize state from localStorage on mount
  useEffect(() => {
    initState();
  }, [initState]);

  // Start cloud sync
  useSync();

  const isLoggedOut = cloudSync.initialized && !cloudSync.user;

  return (
    <>
      <BootOverlay />

      <div
        className={`app-shell${isLoggedOut ? " is-logged-out" : ""}`}
        id="appShell"
      >
        <TopTabs />
        <AuthBar />

        {/* Planner view */}
        <div
          className="top-view"
          hidden={topView !== "planner"}
          id="plannerView"
        >
          <PlannerView />
        </div>

        {/* Results view */}
        <div
          className="top-view"
          hidden={topView !== "results"}
          id="resultsView"
        >
          <ResultsView />
        </div>

        {/* Adjustments view - placeholder */}
        <div
          className="top-view placeholder-view"
          hidden={topView !== "adjustments"}
          id="adjustmentsView"
        >
          <div className="panel placeholder-card">
            <h2>Extra anpassningar</h2>
            <p className="muted small" style={{ marginTop: 8 }}>
              Den här vyn är under utveckling.
            </p>
          </div>
        </div>

        {/* Homework view - placeholder */}
        <div
          className="top-view placeholder-view"
          hidden={topView !== "homework"}
          id="homeworkView"
        >
          <div className="panel placeholder-card">
            <h2>Läxregistrering</h2>
            <p className="muted small" style={{ marginTop: 8 }}>
              Den här vyn är under utveckling.
            </p>
          </div>
        </div>

        {/* Seating / group generator view */}
        <div
          className="top-view"
          hidden={topView !== "seating"}
          id="seatingView"
        >
          <SeatingView />
        </div>

        {/* Classes view */}
        <div
          className="top-view"
          hidden={topView !== "classes"}
          id="classesView"
        >
          <ClassesView />
        </div>

        {/* Links view */}
        <div
          className="top-view"
          hidden={topView !== "links"}
          id="linksView"
        >
          <LinksView />
        </div>
      </div>
    </>
  );
}
