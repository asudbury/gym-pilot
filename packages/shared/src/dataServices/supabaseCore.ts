import { createClient, type SupabaseClient, type PostgrestError } from "@supabase/supabase-js";

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
    undefined
  );
}

type SupabaseClientOptions = {
  persistSession?: boolean;
  autoRefreshToken?: boolean;
};

/** Returns a cached singleton Supabase client, creating one on first call.
 * Throws if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are not set.
 * Pass `{ persistSession: false }` to obtain a separate non-persisting client
 * (e.g. for server-side or admin operations).
 */
export function getSupabaseClient(options?: SupabaseClientOptions) {
  const shouldPersistSession = options?.persistSession ?? true;
  const shouldAutoRefreshToken = options?.autoRefreshToken ?? true;
  const targetClient = shouldPersistSession
    ? supabaseClient
    : supabaseClientNoPersist;

  if (!targetClient) {
    const url = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();

    if (!url) {
      throw new Error(
        "Supabase URL is not configured. Please set VITE_SUPABASE_URL in your environment.",
      );
    }

    if (!anonKey) {
      throw new Error(
        "Supabase anon key is not configured. Please set VITE_SUPABASE_ANON_KEY in your environment.",
      );
    }

    const nextClient = createClient(url, anonKey, {
      auth: {
        persistSession: shouldPersistSession,
        autoRefreshToken: shouldAutoRefreshToken,
        detectSessionInUrl: true,
      },
    });

    if (!nextClient) {
      throw new Error("Supabase client is not initialized.");
    }

    if (shouldPersistSession) {
      supabaseClient = nextClient;
    } else {
      supabaseClientNoPersist = nextClient;
    }

    return nextClient;
  }

  return targetClient;
}

export type OrderByOptions = {
  ascending?: boolean;
  nullsFirst?: boolean;
};

/** Fetches all rows from `tableName`, optionally filtered by `userId`,
 * a date-only window on a column, and/or sorted by a column.
 */
export async function getItems<T>(
  tableName: string,
  options?: {
    userId?: string;
    orderBy?: {
      column: string;
      options?: OrderByOptions;
    };
    dateOnlyFilter?: {
      column: string;
      value: string;
    };
  },
): Promise<{ data: T[] | null; error: PostgrestError | null }> {
  const client = getSupabaseClient();
  let query = client.from(tableName).select("*");

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  if (options?.dateOnlyFilter) {
    const dateValue = options.dateOnlyFilter.value;
    if (dateValue) {
      query = query
        .gte(options.dateOnlyFilter.column, `${dateValue}T00:00:00.000Z`)
        .lt(options.dateOnlyFilter.column, `${dateValue}T23:59:59.999Z`);
    }
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy.column, options.orderBy.options);
  }

  return query as unknown as Promise<{ data: T[] | null; error: PostgrestError | null }>;
}

/** Fetches a single row from `tableName` by optional `userId` and/or `id`.
 * Returns `null` data when no matching row is found.
 */
export async function getItem<T>(
  tableName: string,
  options?: {
    userId?: string;
    id?: string;
  },
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const client = getSupabaseClient();
  let query = client.from(tableName).select("*");

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  if (options?.id) {
    query = query.eq("id", options.id);
  }

  const { data, error } = await query.select().maybeSingle();

  return {
    data: data as T | null,
    error,
  };
}

/** Deletes the row with the given `id` from `tableName`, scoped to `userId` when provided. */
export async function deleteItem(
  tableName: string,
  id: string,
  userId?: string,
): Promise<{ data: unknown[] | null; error: PostgrestError | null }> {
  const client = getSupabaseClient();

  return client.from(tableName).delete().eq("id", id).eq("user_id", userId);
}

// export async function updateItem<T extends Record<string, any>>(
//   tableName: string,
//   id: string,
//   userId: string,
//   payload: T,
// ): Promise<{ data: any[] | null; error: any | null }> {
//   const client = getSupabaseClient();

//   return client.from(tableName)
//     .update(payload)
//     .eq("id", id)
//     .eq("user_id", userId)
//     .select();
// }
