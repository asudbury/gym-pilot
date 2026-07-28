import { deleteItem, getItem, getItems, getSupabaseClient } from "./supabaseCore";
import type { UserSessionWorkoutItem } from "./types";

const tableName = "gym_pilot_user_session_workout_item";

export async function getUserSessionWorkoutItems(
  userId: string,
): Promise<{ data: UserSessionWorkoutItem[] | null; error: any | null }> {
  
  return getItems<UserSessionWorkoutItem>(tableName, {
    userId,
    orderBy: {
      column: 'created_at',
      options: { ascending: false },
    },
  });
}

export async function getUserSessionWorkoutItemsForSession(
  sessionId: string,
): Promise<{ data: UserSessionWorkoutItem[] | null; error: any | null }> {
  
  const client = getSupabaseClient();
  
  return client.from(tableName)
    .select('*')
    .eq("session_id", sessionId) as unknown as Promise<{ data: UserSessionWorkoutItem[] | null; error: any | null }>;
}

export async function getUserSessionWorkoutItem(
  id: string,
  userId: string,
): Promise<{ data: UserSessionWorkoutItem | null; error: any | null }> {
  
  return getItem<UserSessionWorkoutItem>(tableName, userId, id);
}

export async function deleteUserSessionWorkoutItem(id: string, userId: string) {
  
  return deleteItem(tableName, id, userId);
}

export async function updateUserSessionWorkoutItem(
  userSessionWorkoutItem: UserSessionWorkoutItem,
): Promise<{ data: any | null; error: any | null }> {
  
  const client = getSupabaseClient();
  
  return await client
    .from(tableName)
    .upsert(userSessionWorkoutItem, { onConflict: "id" })
    .select()
    .single();
}
