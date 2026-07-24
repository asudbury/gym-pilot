import { getSupabaseClient } from "./supabase";
import { logger } from "./logging";
import { getAuthenticatedUserId } from "./supabaseAuth";

export type SessionHistoryEntry = {
  id: string;
  userId?: string;
  sessionId?: string | null;
  classId?: string | null;
  className?: string | null;
  instructorName?: string | null;
  startedAt?: string | null;
  sessionType?: "class" | "personal_training" | "solo" | null;
  attendanceType: "attended" | "taught";
  notes?: string | null;
  rating?: number | null;
  durationMinutes?: number | null;
  workoutMetadata?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type SupabaseSessionHistoryRow = {
  id: string;
  user_id?: string | null;
  session_id?: string | null;
  class_id?: string | null;
  class_name?: string | null;
  trainer_name?: string | null;
  session_type?: "class" | "personal_training" | "solo" | null;
  start_at?: string | null;
  started_at?: string | null;
  attendance_type?: "attended" | "taught" | null;
  notes?: string | null;
  rating?: number | null;
  duration_minutes?: number | null;
  metadata?: unknown | null;
  created_at?: string | null;
  updated_at?: string | null;
  role?: "client" | "trainer" | null;
  status?: "booked" | "cancelled" | "attended" | "no_show" | "declined" | null;
  session?: {
    class_name?: string | null;
    trainer_name?: string | null;
    start_at?: string | null;
    started_at?: string | null;
    session_type?: "class" | "personal_training" | "solo" | null;
  } | null;
};

function getSessionHistoryTableName() {
  return "gym_pilot_user_session";
}

export function mapSessionHistoryEntryFromSupabase(
  row: SupabaseSessionHistoryRow,
): SessionHistoryEntry {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    sessionId: row.session_id ?? null,
    classId: row.class_id ?? null,
    className: row.class_name ?? row.session?.class_name ?? null,
    instructorName: row.trainer_name ?? row.session?.trainer_name ?? null,
    startedAt:
      row.start_at ??
      row.started_at ??
      row.session?.start_at ??
      row.session?.started_at ??
      null,
    sessionType: row.session_type ?? row.session?.session_type ?? null,
    attendanceType: row.attendance_type === "taught" ? "taught" : "attended",
    notes: row.notes ?? null,
    rating: row.rating ?? null,
    durationMinutes: row.duration_minutes ?? null,
    workoutMetadata: row.metadata ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function formatSessionHistoryError(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "We could not load your session history right now.";
}

export function buildSessionHistoryDeleteError(entryId: string): Error {
  return new Error(`We could not delete session history entry ${entryId}.`);
}

export async function loadSessionHistoryEntries(
  userId?: string,
): Promise<SessionHistoryEntry[]> {
  const client = getSupabaseClient();

  if (!client) {
    return [];
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));

  if (!resolvedUserId) {
    return [];
  }

  try {
    const { data, error } = await client
      .from(getSessionHistoryTableName())
      .select("*")
      .eq("user_id", resolvedUserId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.warn("[Supabase] Could not load session history entries", error);
      return [];
    }

    return (data ?? []).map((row) =>
      mapSessionHistoryEntryFromSupabase(row as SupabaseSessionHistoryRow),
    );
  } catch (error) {
    logger.warn("[Supabase] Could not load session history entries", error);
    return [];
  }
}

export async function saveSessionHistoryEntry(
  entry: SessionHistoryEntry,
  userId?: string,
): Promise<SessionHistoryEntry[]> {
  const client = getSupabaseClient();

  if (!client) {
    return [];
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));

  if (!resolvedUserId) {
    return [];
  }

  const payload = {
    user_id: resolvedUserId,
    session_id: entry.sessionId ?? null,
    class_id: entry.classId ?? null,
    class_name: entry.className ?? null,
    trainer_name: entry.instructorName ?? null,
    session_type: entry.sessionType ?? null,
    start_at: entry.startedAt ?? null,
    attendance_type: entry.attendanceType,
    notes: entry.notes ?? null,
    rating: entry.rating ?? null,
    duration_minutes: entry.durationMinutes ?? null,
    metadata: entry.workoutMetadata ?? null,
  };

  try {
    const { data, error } = await client
      .from(getSessionHistoryTableName())
      .upsert(
        {
          ...payload,
          id: entry.id,
          created_at: entry.createdAt ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .select("*");

    if (error) {
      logger.warn("[Supabase] Could not save session history entry", error);
      return [];
    }

    return (data ?? []).map((row) =>
      mapSessionHistoryEntryFromSupabase(row as SupabaseSessionHistoryRow),
    );
  } catch (error) {
    logger.warn("[Supabase] Could not save session history entry", error);
    return [];
  }
}

export async function deleteSessionHistoryEntry(
  entryId: string,
  userId?: string,
): Promise<void> {
  const client = getSupabaseClient();

  if (!client) {
    return;
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));

  if (!resolvedUserId) {
    return;
  }

  try {
    const { error } = await client
      .from(getSessionHistoryTableName())
      .delete()
      .eq("id", entryId)
      .eq("user_id", resolvedUserId);

    if (error) {
      throw buildSessionHistoryDeleteError(entryId);
    }
  } catch (error) {
    throw buildSessionHistoryDeleteError(entryId);
  }
}

export async function upsertSessionHistoryEntry(
  entry: SessionHistoryEntry,
  userId?: string,
): Promise<SessionHistoryEntry[]> {
  return saveSessionHistoryEntry(entry, userId);
}

export async function removeSessionHistoryEntry(
  entryId: string,
  userId?: string,
): Promise<void> {
  return deleteSessionHistoryEntry(entryId, userId);
}

export function getSessionTableName() {
  return "gym_pilot_session";
}

export function getSessionBookingTableName() {
  return getSessionTableName();
}

export async function createSession(
  payload: Record<string, unknown>,
  userId?: string,
) {
  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));

  if (!resolvedUserId) {
    return null;
  }

  const { error } = await client
    .from(getSessionTableName())
    .insert({ ...payload, user_id: resolvedUserId });

  if (error) {
    logger.warn("[Supabase] Could not create session", error);
    return null;
  }

  return true;
}

export async function bookSession(
  payload: Record<string, unknown>,
  userId?: string,
) {
  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));

  if (!resolvedUserId) {
    return null;
  }

  const { error } = await client
    .from(getSessionBookingTableName())
    .insert({ ...payload, user_id: resolvedUserId });

  if (error) {
    logger.warn("[Supabase] Could not book session", error);
    return null;
  }

  return true;
}

export async function recordSession(
  payload: Record<string, unknown>,
  userId?: string,
) {
  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));

  if (!resolvedUserId) {
    return null;
  }

  const { error } = await client
    .from(getSessionTableName())
    .insert({ ...payload, user_id: resolvedUserId });

  if (error) {
    logger.warn("[Supabase] Could not record session", error);
    return null;
  }

  return true;
}

export async function cancelBooking(bookingId: string, userId?: string) {
  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));

  if (!resolvedUserId) {
    return null;
  }

  const { error } = await client
    .from(getSessionBookingTableName())
    .delete()
    .eq("id", bookingId)
    .eq("user_id", resolvedUserId);

  if (error) {
    logger.warn("[Supabase] Could not cancel booking", error);
    return null;
  }

  return true;
}

export async function listSessions(userId?: string) {
  const client = getSupabaseClient();

  if (!client) {
    return [];
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));

  if (!resolvedUserId) {
    return [];
  }

  const { data, error } = await client
    .from(getSessionTableName())
    .select("*")
    .eq("user_id", resolvedUserId);

  if (error) {
    logger.warn("[Supabase] Could not list sessions", error);
    return [];
  }

  return data ?? [];
}

export async function listBookings(userId?: string) {
  const client = getSupabaseClient();

  if (!client) {
    return [];
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));

  if (!resolvedUserId) {
    return [];
  }

  const { data, error } = await client
    .from(getSessionBookingTableName())
    .select("*")
    .eq("user_id", resolvedUserId);

  if (error) {
    logger.warn("[Supabase] Could not list bookings", error);
    return [];
  }

  return data ?? [];
}
