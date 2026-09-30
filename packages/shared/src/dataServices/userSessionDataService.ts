import { type PostgrestError } from "@supabase/supabase-js";
import {
  deleteItem,
  getItem,
  getItems,
  getSupabaseClient,
} from "./supabaseCore";
import { TableNames } from "./tableNames";
import type { UserSession } from "./types";

const tableName = TableNames.UserSession;

/** Retrieves all session records for the given `userId`, ordered by most recent first. */
export async function getUserSessions(
  userId: string,
): Promise<{ data: UserSession[] | null; error: PostgrestError | null }> {
  return getItems<UserSession>(tableName, {
    userId,
    orderBy: {
      column: "created_at",
      options: { ascending: false },
    },
  });
}

/** Retrieves a single session record by `id` scoped to `userId`. */
export async function getUserSession(
  id: string,
  userId: string,
): Promise<{ data: UserSession | null; error: PostgrestError | null }> {
  return getItem<UserSession>(tableName, { userId, id });
}

/** Deletes the session record with the given `id` for `userId`. */
export async function deleteUserSession(id: string, userId: string) {
  return deleteItem(tableName, id, userId);
}

/** Upserts (insert-or-update) a full `UserSession` row by `id`. */
export async function updateUserSession(userSession: UserSession): Promise<{
  data: UserSession | null;
  error: PostgrestError | null;
}> {
  const client = getSupabaseClient();

  return await client
    .from(tableName)
    .upsert(userSession, { onConflict: "id" })
    .select()
    .single();
}
