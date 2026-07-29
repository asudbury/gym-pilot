import { getItems, getSupabaseClient } from "./supabaseCore";
import type { ErrorLog } from "./types";

const tableName = "gym_pilot_error_log";

export async function getErrorLogs(
  userId?: string,
): Promise<{ data: ErrorLog[] | null; error: any | null }> {
  return getItems<ErrorLog>(tableName, {
    userId,
    orderBy: {
      column: 'created_at',
      options: { ascending: false },
    },
  });
}

export async function logError(
    errorLog: Omit<ErrorLog, "id" | "created_at" | "user_id">,
    userId: string
): Promise<{ data: any[] | null; error: any | null }> {

    const client = getSupabaseClient();
    const fullErrorLog = {
        ...errorLog,
        user_id: userId,
    };

    return await client
      .from(tableName)
      .insert(fullErrorLog)
      .select();
}

export async function deleteAllErrorLogs(): Promise<{ data: any | null; error: any | null }> {
  
    const client = getSupabaseClient();
    return await client
      .from(tableName)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Use a condition that is always true to delete all rows
}
