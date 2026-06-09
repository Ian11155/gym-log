import type { Session, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export const getSupabaseClient = async () => {
  if (!isSupabaseConfigured()) return null;

  if (!client) {
    const { createClient } = await import("@supabase/supabase-js");

    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return client;
};

export async function verifySupabaseConnection() {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: "Supabase env vars are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    };
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/workout_logs?select=id&limit=1`, {
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    return {
      ok: true,
      message: "Cloud reachable. Anonymous workout access is blocked by RLS.",
    };
  }

  if (!response.ok) {
    const body = await response.text();
    return {
      ok: false,
      message: `Cloud check failed: ${body || response.statusText}`,
    };
  }

  const data = await response.json();
  return {
    ok: false,
    message: `Cloud reachable, but anonymous workout read returned ${data?.length || 0} row(s). Check RLS before sync.`,
  };
}

export async function getSupabaseSession(): Promise<Session | null> {
  const supabase = await getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInToSupabase(email: string, password: string): Promise<Session> {
  const supabase = await getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase env vars are missing.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error("Sign-in succeeded but no session was returned.");

  return data.session;
}

export async function signOutOfSupabase() {
  const supabase = await getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
