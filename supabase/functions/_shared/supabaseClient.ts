import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getSupabaseUrl() {
  return Deno.env.get("SUPABASE_URL")?.trim() ?? "";
}

function getSupabaseAnonKey() {
  return Deno.env.get("SUPABASE_ANON_KEY")?.trim() ?? "";
}

function getSupabaseServiceRoleKey() {
    return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
}

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

export function getSupabaseClient(options?: { persistSession: boolean }) {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error("Supabase URL or anon key is not set.");
  }

  supabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: options?.persistSession ?? false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

export function getSupabaseAdminClient() {
    if (supabaseAdminClient) {
        return supabaseAdminClient;
    }

    const url = getSupabaseUrl();
    const serviceRoleKey = getSupabaseServiceRoleKey();

    if (!url || !serviceRoleKey) {
        throw new Error("Supabase URL or service role key is not set.");
    }

    supabaseAdminClient = createClient(url, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });

    return supabaseAdminClient;
}
