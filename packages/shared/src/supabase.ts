/// <reference types="vite/client" />
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { logger } from "./logging";

let supabaseClient: SupabaseClient | null = null;
let supabaseClientNoPersist: SupabaseClient | null = null;

function getSupabaseUrl() {
  return (
    (import.meta.env?.VITE_SUPABASE_URL as string | undefined)?.trim() ||
    undefined
  );
}

function getSupabaseAnonKey() {
  return (
    (import.meta.env?.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
    "anon-key"
  );
}

type SupabaseClientOptions = {
  persistSession?: boolean;
  autoRefreshToken?: boolean;
};

export function getSupabaseClient(options?: SupabaseClientOptions) {
  const shouldPersistSession = options?.persistSession ?? true;
  const shouldAutoRefreshToken = options?.autoRefreshToken ?? true;
  const targetClient = shouldPersistSession
    ? supabaseClient
    : supabaseClientNoPersist;

  if (!targetClient) {
    const url = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();

    if (!url || !anonKey) {
      throw new Error(
        "Supabase URL or anon key is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.",
      );
    }

    logger.info("[Supabase] Creating client", {
      url,
      persistSession: shouldPersistSession,
      autoRefreshToken: shouldAutoRefreshToken,
    });

    const nextClient = createClient(url, anonKey, {
      auth: {
        persistSession: shouldPersistSession,
        autoRefreshToken: shouldAutoRefreshToken,
        detectSessionInUrl: true,
      },
    });

    if (shouldPersistSession) {
      supabaseClient = nextClient;
    } else {
      supabaseClientNoPersist = nextClient;
    }

    return nextClient;
  }

  return targetClient;
}

export async function signInWithPassword(email: string, password: string) {
  logger.info("[Supabase] Starting password sign-in");
  const client = getSupabaseClient();

  if (!client) {
    logger.error(
      "[Supabase] Password sign-in skipped because client is unavailable",
    );
    return { error: new Error("Supabase client is not available") };
  }

  return client.auth.signInWithPassword({ email, password });
}

function normalizeAuthEmail(email: string) {
  const trimmedEmail = email?.trim().toLowerCase() ?? "";

  if (!trimmedEmail) {
    return "user@gym-pilot.local";
  }

  if (trimmedEmail.includes("@")) {
    return trimmedEmail;
  }

  const safeBase =
    trimmedEmail.replace(/\s+/g, ".").replace(/[^a-z0-9._-]/g, "") || "user";
  return `${safeBase}@gym-pilot.local`;
}

export async function signUpWithPassword(
  email: string,
  password: string,
  options?: { passwordChangeRequired?: boolean; persistSession?: boolean },
) {
  const normalizedEmail = normalizeAuthEmail(email);
  logger.info("[Supabase] Creating password-based account", {
    email: normalizedEmail,
    passwordChangeRequired: options?.passwordChangeRequired,
    persistSession: options?.persistSession,
  });
  const client = getSupabaseClient({
    persistSession: options?.persistSession ?? false,
    autoRefreshToken: false,
  });

  if (!client) {
    logger.error(
      "[Supabase] Account creation skipped because client is unavailable",
    );
    return { error: new Error("Supabase client is not available") };
  }

  return client.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        password_change_required: Boolean(options?.passwordChangeRequired),
      },
    },
  });
}

export async function ensureAuthenticatedSupabaseSession(
  client: SupabaseClient,
  email: string,
  password: string,
  signUpResult: Awaited<ReturnType<SupabaseClient["auth"]["signUp"]>>,
) {
  if (signUpResult.error) {
    return signUpResult;
  }

  const session = signUpResult.data?.session;

  if (session) {
    return signUpResult;
  }

  logger.info(
    "[Supabase] Signup did not return a session; signing in with password to establish an auth session",
  );

  const signInResult = await client.auth.signInWithPassword({
    email: normalizeAuthEmail(email),
    password,
  });

  if (signInResult.error || !signInResult.data?.session) {
    return signInResult;
  }

  await client.auth.setSession({
    access_token: signInResult.data.session.access_token,
    refresh_token: signInResult.data.session.refresh_token,
  });

  return signInResult;
}

export async function resetSupabasePassword(email: string) {
  logger.info("[Supabase] Sending password reset email");
  const client = getSupabaseClient();

  if (!client) {
    logger.error(
      "[Supabase] Password reset skipped because client is unavailable",
    );
    return { error: new Error("Supabase client is not available") };
  }

  return client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

export async function changeSupabasePassword(newPassword: string) {
  logger.info("[Supabase] Changing password for current user");
  const client = getSupabaseClient();

  if (!client) {
    logger.error(
      "[Supabase] Password change skipped because client is unavailable",
    );
    return { error: new Error("Supabase client is not available") };
  }

  return client.auth.updateUser({ password: newPassword });
}

export async function signOutFromSupabase() {
  logger.info("[Supabase] Signing out");
  const client = getSupabaseClient();

  if (!client) {
    return { error: null };
  }

  const { error } = await client.auth.signOut();

  if (error) {
    logger.error("[Supabase] Sign-out failed", error);
  }

  return { error };
}
