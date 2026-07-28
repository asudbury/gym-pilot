import { getItems, getSupabaseClient } from "./supabaseCore";
import type { AuditLog } from "./types";

const tableName = "gym_pilot_audit_log";

export async function getAuditLogs(
  userId?: string,
): Promise<{ data: AuditLog[] | null; error: any | null }> {
  return getItems<AuditLog>(tableName, {
    userId,
    orderBy: {
      column: 'created_at',
      options: { ascending: false },
    },
  });
}

export async function logAudit(
    auditLog: Omit<AuditLog, "id" | "created_at" | "user_id">,
    userId: string
): Promise<{ data: any[] | null; error: any | null }> {

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

export async function deleteAllAuditLogs(): Promise<{ data: any | null; error: any | null }> {
  
    const client = getSupabaseClient();
    return await client
      .from(tableName)
      .delete()
      .neq("id", "0"); // Use a condition that is always true to delete all rows
}
