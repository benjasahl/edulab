"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  signIn,
  signUp,
  signOut,
  onAuthStateChanged,
  loadUserState,
  saveUserState,
  deleteOwnAccount,
} from "@/lib/supabase";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSync() {
  const setCloudSync = useAppStore((s) => s.setCloudSync);
  const setCloudUser = useAppStore((s) => s.setCloudUser);
  const loadFromCloud = useAppStore((s) => s.loadFromCloud);
  const data = useAppStore((s) => s.data);
  const cloudUser = useAppStore((s) => s.cloudSync.user);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHashRef = useRef<string>("");

  // ── Auth state listener ──────────────────────────────────────────────────

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (user) {
        setCloudSync({
          initialized: true,
          configured: true,
          available: true,
          user,
        });
        try {
          const remoteData = await loadUserState(user.uid);
          if (remoteData) {
            loadFromCloud(remoteData);
          }
        } catch {
          // Silently ignore load errors — local state remains
        }
      } else {
        setCloudSync({ initialized: true, configured: true, available: true, user: null });
      }
    });

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Debounced cloud save on data changes ─────────────────────────────────

  useEffect(() => {
    if (!cloudUser) return;

    const hash = JSON.stringify(data);
    if (hash === lastHashRef.current) return;
    lastHashRef.current = hash;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        setCloudSync({ syncInFlight: true, lastError: "" });
        await saveUserState(cloudUser.uid, data);
        setCloudSync({
          syncInFlight: false,
          lastSyncedAt: new Date().toISOString(),
          lastError: "",
        });
      } catch (err) {
        setCloudSync({
          syncInFlight: false,
          lastError: err instanceof Error ? err.message : "Okänt fel vid synkronisering",
        });
      }
    }, 2000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [data, cloudUser, setCloudSync]);
}

// ─── Exported action helpers ──────────────────────────────────────────────────

export async function doSignIn(email: string, password: string): Promise<void> {
  const { setCloudSync, setCloudUser } = useAppStore.getState();
  try {
    setCloudSync({ syncInFlight: true, lastError: "" });
    const result = await signIn(email, password);
    const user = result.user
      ? { id: result.user.id, uid: result.user.id, email: result.user.email }
      : null;
    setCloudUser(user);
    setCloudSync({ syncInFlight: false, lastError: "" });
  } catch (err) {
    setCloudSync({
      syncInFlight: false,
      lastError: err instanceof Error ? err.message : "Inloggning misslyckades",
    });
    throw err;
  }
}

export async function doSignUp(email: string, password: string): Promise<void> {
  const { setCloudSync, setCloudUser } = useAppStore.getState();
  try {
    setCloudSync({ syncInFlight: true, lastError: "" });
    const result = await signUp(email, password);
    const user = result.user
      ? { id: result.user.id, uid: result.user.id, email: result.user.email }
      : null;
    setCloudUser(user);
    setCloudSync({ syncInFlight: false, lastError: "" });
  } catch (err) {
    setCloudSync({
      syncInFlight: false,
      lastError: err instanceof Error ? err.message : "Registrering misslyckades",
    });
    throw err;
  }
}

export async function doSignOut(): Promise<void> {
  const { setCloudUser, setCloudSync } = useAppStore.getState();
  try {
    await signOut();
    setCloudUser(null);
    setCloudSync({ lastError: "" });
  } catch (err) {
    setCloudSync({
      lastError: err instanceof Error ? err.message : "Utloggning misslyckades",
    });
    throw err;
  }
}

export async function doDeleteAccount(): Promise<void> {
  const { setCloudUser, setCloudSync } = useAppStore.getState();
  try {
    await deleteOwnAccount();
    setCloudUser(null);
    setCloudSync({ lastError: "" });
  } catch (err) {
    setCloudSync({
      lastError: err instanceof Error ? err.message : "Kontot kunde inte raderas",
    });
    throw err;
  }
}
