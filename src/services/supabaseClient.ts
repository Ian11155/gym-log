import type { SupabaseClient } from "@supabase/supabase-js";

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
  const supabase = await getSupabaseClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase env vars are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    };
  }

  const { data, error } = await supabase.from("workout_logs").select("id").limit(1);

  if (error) {
    if (error.code === "42501" || error.message.toLowerCase().includes("permission denied")) {
      return {
        ok: true,
        message: "Cloud reachable. Anonymous workout access is blocked by RLS.",
      };
    }

    return {
      ok: false,
      message: `Cloud check failed: ${error.message}`,
    };
  }

  return {
    ok: false,
    message: `Cloud reachable, but anonymous workout read returned ${data?.length || 0} row(s). Check RLS before sync.`,
  };
}
