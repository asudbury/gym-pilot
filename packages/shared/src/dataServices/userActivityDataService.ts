import { type PostgrestError } from "@supabase/supabase-js";
import { getItems, getSupabaseClient } from "./supabaseCore";
import { TableNames } from "./tableNames";
import type { UserActivity } from "./types";

const tableName = TableNames.UserActivity;

/** Retrieves all activity records, optionally scoped to `userId`, ordered by most recent first. */
export async function getUserActivity(
  userId?: string
): Promise<{ data: UserActivity[] | null; error: PostgrestError | null }> {
  return getItems<UserActivity>(tableName, { 
    userId,
    orderBy: { 
      column: 'created_at', 
      options: { ascending: false }
    }
  });
}

/** Inserts a new activity record for `userId` into the user activity table. */
export async function logUserActivity(
    activity: Omit<UserActivity, "id" | "created_at" | "user_id">,
    userId: string
): Promise<{ data: unknown[] | null; error: PostgrestError | null }> {
   
    const client = getSupabaseClient();
    const fullActivity = {
        ...activity,
        user_id: userId,
    };
    
    return await client.from(tableName).insert(fullActivity).select();
}

/** Deletes every row in the user activity table. Use with caution – intended for admin/dev use only. */
export async function deleteAllActivity(): Promise<{ data: unknown | null; error: PostgrestError | null }> {
  
    const client = getSupabaseClient();
    return await client
      .from(tableName)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Use a condition that is always true to delete all rows
}
