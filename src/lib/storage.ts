import { AppState, defaultState, STORAGE_KEY, LOCAL_BACKUP_KEY } from "@/types";

export function loadState(): AppState {
  if (typeof window === "undefined") return { ...defaultState };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    return JSON.parse(raw) as AppState;
  } catch {
    return { ...defaultState };
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function saveLocalBackup(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function loadLocalBackup(): AppState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function hashState(state: AppState): string {
  try {
    return JSON.stringify(state).length.toString();
  } catch {
    return "0";
  }
}
