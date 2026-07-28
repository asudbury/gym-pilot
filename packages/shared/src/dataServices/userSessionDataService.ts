import { deleteItem, getItem, getItems, getSupabaseClient } from "./supabaseCore";
import type { UserSession } from "./types";

const tableName = "gym_pilot_user_session";

export async function getUserSessions(userId: string): 
  Promise<{ data: UserSession[] | null; error: any | null }> {
  
  return getItems<UserSession>(tableName, {
    userId,
    orderBy: {
      column: 'created_at',
      options: { ascending: false },
    },
  });
}

export async function getUserSession(id: string, userId: string): 
  Promise<{ data: UserSession | null; error: any | null }> {
  
  return getItem<UserSession>(tableName, userId, id);
}

export async function deleteUserSession(id: string, userId: string) {
  
  return deleteItem(tableName, id, userId);
}

export async function updateUserSession(userSession: UserSession) : 
  Promise<{ data: any[] | null; error: any | null }> {

    const client = getSupabaseClient();
    
    return await client
      .from(tableName)
      .upsert(userSession, { onConflict: "id" })
      .select()
      .single();
}

