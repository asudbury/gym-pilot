import { type PostgrestError } from "@supabase/supabase-js";
import { getItems, getSupabaseClient } from "./supabaseCore";
import { TableNames } from "./tableNames";
import type { AuditLog } from "./types";

const tableName = TableNames.AuditLog;

/** Retrieves all audit log entries, optionally scoped to `userId`, ordered by most recent first. */
export async function getAuditLogs(
  userId?: string,
): Promise<{ data: AuditLog[] | null; error: PostgrestError | null }> {
  return getItems<AuditLog>(tableName, {
    userId,
    orderBy: {
      column: 'created_at',
      options: { ascending: false },
    },
  });
}

/** Inserts a new audit log entry for `userId`. */
export async function logAudit(
    auditLog: Omit<AuditLog, "id" | "created_at" | "user_id">,
    userId: string
): Promise<{ data: unknown[] | null; error: PostgrestError | null }> {

    const client = getSupabaseClient();
    const fullAuditLog = {
        ...auditLog,
        user_id: userId,
    };

    return await client
      .from(tableName)
      .insert(fullAuditLog)
      .select();
}

/** Deletes every row in the audit log table. Use with caution – intended for admin/dev use only. */
export async function deleteAllAuditLogs(): Promise<{ data: unknown | null; error: PostgrestError | null }> {
  
    const client = getSupabaseClient();
    return await client
      .from(tableName)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Use a condition that is always true to delete all rows
}
