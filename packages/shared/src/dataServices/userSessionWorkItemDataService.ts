import { type PostgrestError } from "@supabase/supabase-js";
import { deleteItem, getItem, getItems, getSupabaseClient } from "./supabaseCore";
import { TableNames } from "./tableNames";
import type { UserSessionWorkoutItem } from "./types";

const tableName = TableNames.UserSessionWorkoutItem;

/** Retrieves all workout items for `userId`, ordered by most recent first. */
export async function getUserSessionWorkoutItems(
  userId: string,
): Promise<{ data: UserSessionWorkoutItem[] | null; error: PostgrestError | null }> {
  
  return getItems<UserSessionWorkoutItem>(tableName, {
    userId,
    orderBy: {
      column: 'created_at',
      options: { ascending: false },
    },
  });
}

/** Retrieves all workout items belonging to the given `sessionId`. */
export async function getUserSessionWorkoutItemsForSession(
  sessionId: string,
): Promise<{ data: UserSessionWorkoutItem[] | null; error: PostgrestError | null }> {
  
  const client = getSupabaseClient();
  
  return client.from(tableName)
    .select('*')
    .eq("session_id", sessionId) as unknown as Promise<{ data: UserSessionWorkoutItem[] | null; error: PostgrestError | null }>;
}

/** Retrieves a single workout item by `id` scoped to `userId`. */
export async function getUserSessionWorkoutItem(
  id: string,
  userId: string,
): Promise<{ data: UserSessionWorkoutItem | null; error: PostgrestError | null }> {
  
  return getItem<UserSessionWorkoutItem>(tableName, { userId, id });
}

/** Deletes the workout item with the given `id` for `userId`. */
export async function deleteUserSessionWorkoutItem(id: string, userId: string) {
  
  return deleteItem(tableName, id, userId);
}

/** Upserts (insert-or-update) a full `UserSessionWorkoutItem` row by `id`. */
export async function updateUserSessionWorkoutItem(
  userSessionWorkoutItem: UserSessionWorkoutItem,
): Promise<{ data: UserSessionWorkoutItem | null; error: PostgrestError | null }> {
  
  const client = getSupabaseClient();
  
  return await client
    .from(tableName)
    .upsert(userSessionWorkoutItem, { onConflict: "id" })
    .select()
    .single();
}
