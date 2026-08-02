import { logger } from "../logging";
import { loadSupabaseProfileSnapshot } from "../profilePersistence";
import { saveWorkoutItemsForSession } from "../sessionWorkoutPersistence";
import { getSupabaseClient } from "../supabase";
import { getAuthenticatedUserId } from "../supabaseAuth";
import { recordSupabaseUserActivity } from "../userActivity";
import type { UserSessionWorkoutItem } from "./types";

export function normalizeSessionTypeForPersistence(
  sessionType: string | null | undefined,
) {
  if (
    sessionType === "class" ||
    sessionType === "personal_training" ||
    sessionType === "solo"
  ) {
    return sessionType;
  }

  return "solo";
}

function normalizeSessionRating(value: number | string | null | undefined) {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 1 &&
    value <= 5
  ) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 5) {
      return parsed;
    }
  }

  return null;
}

export function buildSessionBookingSessionPayload(input: {
  userId: string;
  sessionId?: string | number | null;
  classId?: string | number | null;
  className?: string | null;
  instructorName?: string | null;
  startedAt?: string | null;
  attendanceType: "attended" | "taught";
  notes?: string | null;
  rating?: number | null;
  durationMinutes?: number | null;
  metadata?: unknown | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  role?: "client" | "trainer" | null;
  status?: "booked" | "cancelled" | "attended" | "no_show" | "declined" | null;
  sessionType?: "class" | "personal_training" | "solo" | null;
}) {
  const resolvedSessionType = normalizeSessionTypeForPersistence(
    input.sessionType ??
      (input.classId || input.className
        ? "class"
        : input.instructorName
          ? "personal_training"
          : "solo"),
  );

  return {
    user_id: input.userId,
    session_id: input.sessionId != null ? String(input.sessionId) : null,
    class_id: input.classId != null ? String(input.classId) : null,
    class_name: input.className ?? null,
    trainer_name: input.instructorName?.trim()
      ? input.instructorName.trim()
      : null,
    start_at: input.startedAt ?? null,
    attendance_type: input.attendanceType,
    notes: input.notes?.trim() ? input.notes.trim() : null,
    rating: normalizeSessionRating(input.rating),
    duration_minutes: input.durationMinutes ?? null,
    metadata: input.metadata ?? null,
    created_at: input.createdAt ?? new Date().toISOString(),
    updated_at: input.updatedAt ?? new Date().toISOString(),
    role:
      input.role ?? (input.attendanceType === "taught" ? "trainer" : "client"),
    status: input.status ?? "attended",
    session_type: resolvedSessionType,
  };
}

export function buildSessionBookingAttendancePayload(input: {
  userId: string;
  sessionId?: string | number | null;
  classId?: string | number | null;
  className?: string | null;
  instructorName?: string | null;
  startedAt?: string | null;
  attendanceType: "attended" | "taught";
  notes?: string | null;
  rating?: number | null;
  durationMinutes?: number | null;
  metadata?: unknown | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  role?: "client" | "trainer" | null;
  status?: "booked" | "cancelled" | "attended" | "no_show" | "declined" | null;
}) {
  return buildSessionBookingSessionPayload(input);
}

export function getSessionHistoryTableName() {
  return getSessionTableName();
}

export function getSessionHistorySelectColumns() {
  return [
    "id",
    "user_id",
    "session_id",
    "class_id",
    "class_name",
    "trainer_name",
    "session_type",
    "start_at",
    "attendance_type",
    "notes",
    "rating",
    "metadata",
    "created_at",
    "updated_at",
    "role",
    "status",
    "session:session_id",
  ];
}

export function getSessionTableName() {
  return "gym_pilot_user_session";
}

export function getSessionBookingTableName() {
  return getSessionTableName();
}

export async function saveTimetableAttendance(input: {
  userId?: string;
  sessionId?: string | number | null;
  classId?: string | number | null;
  className?: string | null;
  instructorName?: string | null;
  startedAt?: string | null;
  attendanceType: "attended" | "taught";
  notes?: string | null;
  rating?: number | null;
  durationMinutes?: number | null;
}) {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false as const,
      error: new Error("Supabase client is not available"),
    };
  }

  const resolvedUserId = input.userId || (await getAuthenticatedUserId(client));

  if (!resolvedUserId) {
    return {
      success: false as const,
      error: new Error("Unable to resolve the current user"),
    };
  }

  let existingId: string | null = null;
  let tableExists = true;

  if (
    input.sessionId != null ||
    (input.classId != null && input.startedAt != null)
  ) {
    let query = client
      .from(getSessionHistoryTableName())
      .select("id")
      .eq("user_id", resolvedUserId);

    if (input.sessionId != null) {
      query = query.eq("session_id", String(input.sessionId));
    } else {
      query = query
        .eq("class_id", String(input.classId))
        .eq("start_at", input.startedAt);
    }

    const { data: existingData, error: selectError } = await query.limit(1);
    if (selectError) {
      const isMissingTable =
        selectError.message?.includes("Could not find the table") ||
        selectError.message?.includes("does not exist");
      if (isMissingTable) {
        tableExists = false;
      }
    } else if (existingData && existingData.length > 0) {
      existingId = existingData[0].id;
    }
  }

  let dbResult: { data: any[] | null; error: any } = {
    data: null,
    error: null,
  };

  if (!tableExists) {
    dbResult.error = {
      message: `Could not find the table ${getSessionHistoryTableName()}`,
    };
  } else if (existingId) {
    dbResult = await client
      .from(getSessionHistoryTableName())
      .update(
        buildSessionBookingSessionPayload({
          userId: resolvedUserId,
          sessionId: input.sessionId,
          classId: input.classId,
          className: input.className,
          instructorName: input.instructorName,
          startedAt: input.startedAt,
          attendanceType: input.attendanceType,
          notes: input.notes,
          rating: input.rating,
          durationMinutes: input.durationMinutes,
        }),
      )
      .eq("id", existingId)
      .select();
  } else {
    dbResult = await client
      .from(getSessionHistoryTableName())
      .insert(
        buildSessionBookingSessionPayload({
          userId: resolvedUserId,
          sessionId: input.sessionId,
          classId: input.classId,
          className: input.className,
          instructorName: input.instructorName,
          startedAt: input.startedAt,
          attendanceType: input.attendanceType,
          notes: input.notes,
          rating: input.rating,
          durationMinutes: input.durationMinutes,
        }),
      )
      .select();
  }

  const { error } = dbResult;

  if (error) {
    const isMissingTableError =
      error.message?.includes("Could not find the table") ||
      error.message?.includes("does not exist");

    if (isMissingTableError) {
      logger.warn(
        "[Supabase] gym_pilot_class_attendance table is not available yet; recording attendance as a user activity fallback",
        error,
      );
      await recordSupabaseUserActivity(
        "timetable_attendance",
        {
          sessionId: input.sessionId != null ? String(input.sessionId) : null,
          classId: input.classId != null ? String(input.classId) : null,
          className: input.className ?? null,
          instructorName: input.instructorName?.trim()
            ? input.instructorName.trim()
            : null,
          startedAt: input.startedAt ?? null,
          attendanceType: input.attendanceType,
          notes: input.notes?.trim() ? input.notes.trim() : null,
          rating: input.rating ?? null,
        },
        resolvedUserId,
      );

      return { success: true as const, fallback: true as const };
    }

    logger.error("[Supabase] Could not save timetable attendance", error);
    return { success: false as const, error };
  }

  return { success: true as const };
}

export async function createSession(input: {
  gymClubId?: number | null;
  sessionType: "class" | "personal_training" | "solo";
  classId?: string | null;
  className?: string | null;
  trainerId?: string | null;
  trainerName?: string | null;
  startAt: string;
  durationMinutes?: number | null;
  location?: string | null;
  capacity?: number | null;
  price?: number | null;
  metadata?: any | null;
}) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false as const,
      error: new Error("Supabase client is not available"),
    };
  }

  const resolvedUserId = await getAuthenticatedUserId(client);
  const payload = buildSessionRecordPayload({
    userId: resolvedUserId,
    gymClubId: input.gymClubId,
    sessionType: input.sessionType,
    classId: input.classId,
    className: input.className,
    trainerId: input.trainerId,
    trainerName: input.trainerName,
    startAt: input.startAt,
    durationMinutes: input.durationMinutes,
    location: input.location,
    capacity: input.capacity,
    price: input.price,
    metadata: input.metadata,
  });

  const { data, error } = await client
    .from(getSessionTableName())
    .insert(payload)
    .select();

  if (error) {
    logger.error("[Supabase] Could not create session", error);
    return { success: false as const, error };
  }

  const createdSession = data && data[0];

  if (createdSession && resolvedUserId) {
    const profileSnapshot = await loadSupabaseProfileSnapshot(resolvedUserId);
    await recordSupabaseUserActivity(
      "session_created",
      {
        sessionId: createdSession.id ?? null,
        sessionType: input.sessionType,
        startAt: input.startAt,
        durationMinutes: input.durationMinutes ?? null,
        trainerName: input.trainerName?.trim()
          ? input.trainerName.trim()
          : null,
      },
      resolvedUserId,
      profileSnapshot.friendlyName,
    );
  }

  return { success: true as const, session: createdSession };
}

export async function bookSession(input: {
  sessionId: string;
  userId?: string;
  role: "client" | "trainer";
  notes?: string | null;
  rating?: number | null;
  workoutMetadata?: unknown | null;
}) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false as const,
      error: new Error("Supabase client is not available"),
    };
  }

  const resolvedUserId = input.userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return {
      success: false as const,
      error: new Error("Unable to resolve the current user"),
    };
  }

  const payload = {
    user_id: resolvedUserId,
    session_id: input.sessionId,
    role: input.role,
    status: "attended",
    notes: input.notes ?? null,
    rating: normalizeSessionRating(input.rating),
    metadata: input.workoutMetadata ?? null,
    attendance_type: input.role === "trainer" ? "taught" : "attended",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from(getSessionTableName())
    .update(payload)
    .eq("id", input.sessionId)
    .select();

  if (error) {
    logger.error("[Supabase] Could not book session", error);
    return { success: false as const, error };
  }

  return { success: true as const, booking: data && data[0] };
}

export async function recordSession(input: {
  sessionId: string;
  userId?: string;
  role: "client" | "trainer";
  notes?: string | null;
  rating?: number | null;
  workoutMetadata?: unknown | null;
  workoutItems?: UserSessionWorkoutItem[];
}) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false as const,
      error: new Error("Supabase client is not available"),
    };
  }

  const bookingResult = await bookSession(input);
  if (!bookingResult.success) {
    logger.error(
      "[Supabase] Session booking failed before workout persistence",
      bookingResult.error,
    );
    return bookingResult;
  }

  const resolvedUserId = input.userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId || !input.workoutItems?.length) {
    const fallbackError = resolvedUserId
      ? bookingResult.error
      : new Error("No authenticated user available to persist workout rows");

    logger.error(
      "[Supabase] Workout rows were not persisted because no authenticated user was available",
      fallbackError,
    );

    return {
      ...bookingResult,
      error: fallbackError,
    };
  }

  const saveResult = await saveWorkoutItemsForSession(
    input.sessionId,
    input.workoutItems,
    resolvedUserId,
  );

  if (!saveResult.success) {
    const workoutPersistenceError =
      saveResult.error instanceof Error
        ? saveResult.error
        : new Error("Could not persist workout rows for recorded session");

    logger.error(
      "[Supabase] Could not persist workout rows for recorded session",
      workoutPersistenceError,
    );
    return {
      ...bookingResult,
      success: false,
      error: workoutPersistenceError,
    };
  }

  return bookingResult;
}

export async function cancelBooking(input: {
  bookingId?: string;
  sessionId?: string;
  userId?: string;
}) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false as const,
      error: new Error("Supabase client is not available"),
    };
  }

  const resolvedUserId = input.userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return {
      success: false as const,
      error: new Error("Unable to resolve the current user"),
    };
  }

  let query = client
    .from(getSessionTableName())
    .update({ status: "cancelled", updated_at: new Date().toISOString() });

  if (input.bookingId) {
    query = query.eq("id", input.bookingId).eq("user_id", resolvedUserId);
  } else if (input.sessionId) {
    query = query.eq("id", input.sessionId).eq("user_id", resolvedUserId);
  } else {
    return {
      success: false as const,
      error: new Error("bookingId or sessionId required"),
    };
  }

  const { data, error } = await query.select();

  if (error) {
    logger.error("[Supabase] Could not cancel booking", error);
    return { success: false as const, error };
  }

  return { success: true as const, bookings: data };
}

export async function listSessions(filters?: {
  userId?: string;
  trainerId?: string;
  from?: string;
  to?: string;
  status?: string;
}) {
  const client = getSupabaseClient();
  if (!client) {
    return [] as any[];
  }

  let query = client.from(getSessionTableName()).select("*");

  if (filters?.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.trainerId) {
    query = query.eq("trainer_id", filters.trainerId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    logger.warn("[Supabase] Could not list bookings", error);
    return [];
  }

  let results = Array.isArray(data) ? data : [];

  results = results.map((row: any) => ({
    ...row,
    session: {
      class_name: row.class_name ?? null,
      session_type: row.session_type ?? null,
      start_at: row.start_at ?? null,
      trainer_name: row.trainer_name ?? null,
    },
  }));

  if (filters?.from || filters?.to) {
    results = results.filter((r: any) => {
      const start = r.start_at ? new Date(r.start_at) : null;
      if (!start) return false;
      if (filters?.from && start < new Date(filters.from)) return false;
      if (filters?.to && start > new Date(filters.to)) return false;
      return true;
    });
  }

  return results;
}

export async function listBookings(filters?: {
  userId?: string;
  trainerId?: string;
  from?: string;
  to?: string;
  status?: string;
}) {
  return listSessions(filters);
}

export function buildSessionRecordPayload(input: {
  userId?: string | null;
  gymClubId?: number | null;
  sessionType: "class" | "personal_training" | "solo";
  classId?: string | null;
  className?: string | null;
  trainerId?: string | null;
  trainerName?: string | null;
  startAt: string;
  durationMinutes?: number | null;
  location?: string | null;
  capacity?: number | null;
  price?: number | null;
  metadata?: any | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}) {
  return {
    gym_club_id: input.gymClubId ?? null,
    session_type: normalizeSessionTypeForPersistence(input.sessionType),
    class_id: input.classId ?? null,
    class_name: input.className ?? null,
    trainer_id: input.trainerId ?? null,
    trainer_name: input.trainerName ?? null,
    start_at: input.startAt,
    duration_minutes: input.durationMinutes ?? null,
    location: input.location ?? null,
    capacity: input.capacity ?? null,
    price: input.price ?? null,
    metadata: input.metadata ?? null,
    user_id: input.userId ?? null,
    session_id: null,
    role: null,
    status: "attended",
    notes: null,
    rating: null,
    attendance_type: null,
    created_at: input.createdAt ?? new Date().toISOString(),
    updated_at: input.updatedAt ?? new Date().toISOString(),
  };
}
