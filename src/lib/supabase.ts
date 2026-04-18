import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { AppState } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const isConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl.startsWith("https://");

// We only instantiate the client in the browser (or when both values are present).
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!isConfigured) return null;
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _client;
}

export interface SupabaseUser extends User {
  uid: string;
}

function normalizeUser(user: User | null): SupabaseUser | null {
  if (!user) return null;
  return { ...user, uid: user.id };
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const client = getClient();
  if (!client) throw new Error("Supabase är inte redo ännu.");
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const client = getClient();
  if (!client) throw new Error("Supabase är inte redo ännu.");
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = getClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<SupabaseUser | null> {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return normalizeUser(data?.user ?? null);
}

export function onAuthStateChanged(
  callback: (user: SupabaseUser | null) => void
): () => void {
  const client = getClient();
  if (!client) {
    callback(null);
    return () => {};
  }

  let lastUserId = "__unset__";
  const emitIfChanged = (user: User | null) => {
    const normalized = normalizeUser(user);
    const nextId = normalized?.uid ?? "";
    if (lastUserId === nextId) return;
    lastUserId = nextId;
    callback(normalized);
  };

  // Immediately restore from persisted session.
  client.auth
    .getSession()
    .then(({ data }) => {
      emitIfChanged(data?.session?.user ?? null);
    })
    .catch(() => {
      emitIfChanged(null);
    });

  const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
    if (_event === "SIGNED_OUT") {
      emitIfChanged(null);
      return;
    }
    emitIfChanged(session?.user ?? null);
  });

  return () => listener?.subscription?.unsubscribe?.();
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

export async function loadUserState(uid: string): Promise<AppState | null> {
  const client = getClient();
  if (!client) return null;
  const { data, error } = await client
    .from("planner_documents")
    .select("data")
    .eq("user_id", uid)
    .maybeSingle();
  if (error) throw error;
  return (data?.data as AppState) ?? null;
}

export async function saveUserState(uid: string, state: AppState): Promise<void> {
  const client = getClient();
  if (!client) return;
  const { error } = await client.from("planner_documents").upsert(
    { user_id: uid, data: state, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function deleteOwnAccount(): Promise<void> {
  const client = getClient();
  if (!client) throw new Error("Supabase är inte redo ännu.");
  const { error } = await client.rpc("delete_my_account");
  if (error) throw error;
}

export const supabaseConfigured = isConfigured;
