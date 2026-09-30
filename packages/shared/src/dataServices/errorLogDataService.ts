import { type PostgrestError } from "@supabase/supabase-js";
import { getItems, getSupabaseClient } from "./supabaseCore";
import { TableNames } from "./tableNames";
import type { ErrorLog } from "./types";

const tableName = TableNames.ErrorLog;

/** Retrieves all error log entries, optionally scoped to `userId`, ordered by most recent first. */
export async function getErrorLogs(
  userId?: string,
): Promise<{ data: ErrorLog[] | null; error: PostgrestError | null }> {
  return getItems<ErrorLog>(tableName, {
    userId,
    orderBy: {
      column: 'created_at',
      options: { ascending: false },
    },
  });
}

/** Inserts a new error log entry for `userId`. */
export async function logError(
    errorLog: Omit<ErrorLog, "id" | "created_at" | "user_id">,
    userId: string
): Promise<{ data: unknown[] | null; error: PostgrestError | null }> {

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

/** Deletes every row in the error log table. Use with caution – intended for admin/dev use only. */
export async function deleteAllErrorLogs(): Promise<{ data: unknown | null; error: PostgrestError | null }> {
  
    const client = getSupabaseClient();
    return await client
      .from(tableName)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Use a condition that is always true to delete all rows
}
