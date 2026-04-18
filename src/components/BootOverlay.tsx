"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { doSignIn, doSignUp } from "@/hooks/useSync";

// ─── BootOverlay ──────────────────────────────────────────────────────────────

export default function BootOverlay() {
  const bootVisible = useAppStore((s) => s.bootVisible);
  const initialized = useAppStore((s) => s.cloudSync.initialized);
  const user = useAppStore((s) => s.cloudSync.user);
  const authMode = useAppStore((s) => s.authMode);
  const setBootVisible = useAppStore((s) => s.setBootVisible);
  const setAuthMode = useAppStore((s) => s.setAuthMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-hide once a user is present
  useEffect(() => {
    if (user) {
      setBootVisible(false);
    }
  }, [user, setBootVisible]);

  // Nothing to show once boot is complete
  if (!bootVisible) return null;

  // ── Loading spinner while initializing ───────────────────────────────────

  if (!initialized) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm font-medium text-slate-600">Laddar…</p>
        </div>
      </div>
    );
  }

  // ── Auth card once initialized and no user ────────────────────────────────

  const isSignIn = authMode === "signin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignIn) {
        await doSignIn(email, password);
      } else {
        await doSignUp(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ett fel uppstod. Försök igen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        {/* Title */}
        <h1 className="mb-1 text-center text-2xl font-bold text-slate-800">
          Lärarplanering
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          {isSignIn ? "Logga in på ditt konto" : "Skapa ett nytt konto"}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={isSignIn ? "current-password" : "new-password"}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Primary action */}
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white font-semibold px-3.5 py-2 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading
              ? "Vänta…"
              : isSignIn
              ? "Logga in"
              : "Skapa konto"}
          </button>
        </form>

        {/* Switch mode */}
        <p className="mt-4 text-center text-sm text-slate-500">
          {isSignIn ? (
            <>
              Inget konto?{" "}
              <button
                type="button"
                onClick={() => { setAuthMode("signup"); setError(""); }}
                className="font-semibold text-indigo-600 hover:underline"
              >
                Skapa konto
              </button>
            </>
          ) : (
            <>
              Har du redan ett konto?{" "}
              <button
                type="button"
                onClick={() => { setAuthMode("signin"); setError(""); }}
                className="font-semibold text-indigo-600 hover:underline"
              >
                Logga in
              </button>
            </>
          )}
        </p>

        {/* Continue without account */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setBootVisible(false)}
            className="w-full bg-transparent border border-slate-200 text-slate-700 font-semibold px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-colors text-sm"
          >
            Fortsätt utan konto
          </button>
        </div>
      </div>
    </div>
  );
}
