"use client";

import { useAppStore } from "@/store/useAppStore";
import { doSignOut } from "@/hooks/useSync";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ─── AuthBar ──────────────────────────────────────────────────────────────────

export default function AuthBar() {
  const cloudSync = useAppStore((s) => s.cloudSync);
  const setBootVisible = useAppStore((s) => s.setBootVisible);

  // Render nothing until initialization is complete
  if (!cloudSync.initialized) return null;

  // ── Sync status dot ───────────────────────────────────────────────────────

  function SyncDot() {
    if (cloudSync.lastError) {
      return (
        <span
          className="inline-block h-2 w-2 rounded-full bg-red-500"
          title={cloudSync.lastError}
        />
      );
    }
    if (cloudSync.syncInFlight) {
      return <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />;
    }
    return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />;
  }

  // ── Logged-in state ───────────────────────────────────────────────────────

  if (cloudSync.user) {
    return (
      <div className="flex gap-2 items-center text-sm text-slate-600">
        <SyncDot />

        <span className="text-slate-700 font-medium truncate max-w-[180px]">
          {cloudSync.user.email ?? cloudSync.user.uid}
        </span>

        {cloudSync.lastSyncedAt && !cloudSync.syncInFlight && !cloudSync.lastError && (
          <span className="text-slate-400 text-xs">
            Synkad {formatTime(cloudSync.lastSyncedAt)}
          </span>
        )}

        {cloudSync.syncInFlight && (
          <span className="text-slate-400 text-xs">Sparar…</span>
        )}

        {cloudSync.lastError && (
          <span className="text-red-500 text-xs" title={cloudSync.lastError}>
            Fel vid synk
          </span>
        )}

        <button
          type="button"
          onClick={() => doSignOut()}
          className="bg-transparent border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors text-xs"
        >
          Logga ut
        </button>
      </div>
    );
  }

  // ── Logged-out state ──────────────────────────────────────────────────────

  return (
    <div className="flex gap-2 items-center text-sm text-slate-500">
      <span>Inte inloggad</span>
      <button
        type="button"
        onClick={() => setBootVisible(true)}
        className="text-orange-600 font-semibold hover:underline text-sm"
      >
        Logga in
      </button>
    </div>
  );
}
