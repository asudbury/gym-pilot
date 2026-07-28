import { getItems, getSupabaseClient } from "./supabaseCore";
import type { UserActivity } from "./types";

const tableName = "gym_pilot_user_activity";

export async function getUserActivity(
  userId?: string
): Promise<{ data: UserActivity[] | null; error: any | null }> {
  return getItems<UserActivity>(tableName, { 
    userId,
    orderBy: { 
      column: 'created_at', 
      options: { ascending: false }
    }
  });
}

export async function logUserActivity(
    activity: Omit<UserActivity, "id" | "created_at" | "user_id">,
    userId: string
): Promise<{ data: any[] | null; error: any | null }> {
   
    const client = getSupabaseClient();
    const fullActivity = {
        ...activity,
        user_id: userId,
    };
    
    return await client.from(tableName).insert(fullActivity).select();
}

export async function deleteAllActivity(): Promise<{ data: any | null; error: any | null }> {
  
    const client = getSupabaseClient();
    return await client
      .from(tableName)
      .delete()
      .neq("id", "0"); // Use a condition that is always true to delete all rows
}
