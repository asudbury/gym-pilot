import { getSupabaseClient } from "./supabase";
import { logger } from "./logging";
import { getAuthenticatedUserId } from "./supabaseAuth";
import {
  createSessionWorkoutItem,
  normalizeSessionWorkoutCategory,
  type SessionWorkoutItem,
} from "./sessionWorkout";

function normalizeSessionRowId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : null;
}

function normalizeWorkoutItemRecord(value: unknown): SessionWorkoutItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const category =
    typeof candidate.category === "string"
      ? normalizeSessionWorkoutCategory(candidate.category)
      : "exercise";
  const exerciseName =
    typeof candidate.exerciseName === "string" ? candidate.exerciseName : "";

  if (!exerciseName && typeof candidate.exercise_name === "string") {
    return createSessionWorkoutItem({
      category,
      exerciseName: candidate.exercise_name,
      exerciseId:
        typeof candidate.exercise_id === "string"
          ? candidate.exercise_id
          : undefined,
      reps: typeof candidate.reps === "string" ? candidate.reps : "",
      sets: typeof candidate.sets === "string" ? candidate.sets : "",
      weight: typeof candidate.weight === "string" ? candidate.weight : "",
      durationMinutes:
        typeof candidate.duration_minutes === "string"
          ? candidate.duration_minutes
          : "",
      distanceKm:
        typeof candidate.distance_km === "string" ? candidate.distance_km : "",
      speedKph:
        typeof candidate.speed_kph === "string" ? candidate.speed_kph : "",
      notes: typeof candidate.notes === "string" ? candidate.notes : "",
      planItemId:
        typeof candidate.plan_item_id === "string"
          ? candidate.plan_item_id
          : undefined,
      sortOrder:
        typeof candidate.sort_order === "number"
          ? candidate.sort_order
          : typeof candidate.sortOrder === "number"
            ? candidate.sortOrder
            : undefined,
    });
  }

  return createSessionWorkoutItem({
    id: typeof candidate.id === "string" ? candidate.id : undefined,
    category,
    exerciseName,
    exerciseId:
      typeof candidate.exercise_id === "string"
        ? candidate.exercise_id
        : undefined,
    reps: typeof candidate.reps === "string" ? candidate.reps : "",
    sets: typeof candidate.sets === "string" ? candidate.sets : "",
    weight: typeof candidate.weight === "string" ? candidate.weight : "",
    durationMinutes:
      typeof candidate.durationMinutes === "string"
        ? candidate.durationMinutes
        : "",
    distanceKm:
      typeof candidate.distanceKm === "string" ? candidate.distanceKm : "",
    speedKph: typeof candidate.speedKph === "string" ? candidate.speedKph : "",
    notes: typeof candidate.notes === "string" ? candidate.notes : "",
    planItemId:
      typeof candidate.planItemId === "string"
        ? candidate.planItemId
        : undefined,
    sortOrder:
      typeof candidate.sortOrder === "number"
        ? candidate.sortOrder
        : typeof candidate.sort_order === "number"
          ? candidate.sort_order
          : undefined,
  });
}

function createWorkoutItemPayload(input: {
  sessionId: string;
  userId: string;
  index: number;
  item: SessionWorkoutItem;
  parentSessionRowId?: string | null;
}) {
  return {
    id: input.item.id || `item-${input.index}`,
    session_id: input.sessionId,
    user_id: input.userId,
    item_index: input.index + 1000000,
    category: input.item.category,
    exercise_name: input.item.exerciseName ?? null,
    exercise_id: input.item.exerciseId ?? null,
    reps: input.item.reps ?? null,
    sets: input.item.sets ?? null,
    weight: input.item.weight ?? null,
    duration_minutes: input.item.durationMinutes ?? null,
    distance_km: input.item.distanceKm ?? null,
    speed_kph: input.item.speedKph ?? null,
    notes: input.item.notes ?? null,
    plan_item_id: input.item.planItemId ?? null,
    session_row_id: normalizeSessionRowId(
      input.parentSessionRowId ?? input.sessionId,
    ),
    sort_order: input.item.sortOrder ?? input.index,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function buildWorkoutItemsPersistencePayloads(input: {
  sessionId: string;
  userId: string;
  workoutItems: SessionWorkoutItem[];
  parentSessionRowId?: string | null;
}) {
  const normalizedItems = input.workoutItems.map((item, index) => ({
    ...item,
    id: item.id || `item-${index}`,
    sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index,
    originalIndex: index,
  }));

  const orderedItems = [...normalizedItems].sort((left, right) => {
    const leftSortOrder =
      typeof left.sortOrder === "number" ? left.sortOrder : left.originalIndex;
    const rightSortOrder =
      typeof right.sortOrder === "number"
        ? right.sortOrder
        : right.originalIndex;

    if (leftSortOrder !== rightSortOrder) {
      return leftSortOrder - rightSortOrder;
    }

    return left.originalIndex - right.originalIndex;
  });

  return orderedItems.map((item, index) =>
    createWorkoutItemPayload({
      sessionId: input.sessionId,
      userId: input.userId,
      index,
      parentSessionRowId: input.parentSessionRowId,
      item: {
        ...item,
        sortOrder: index,
      },
    }),
  );
}

export function getWorkoutItemsTableName() {
  return "gym_pilot_user_session_workout_item";
}

export async function loadWorkoutItemsForSession(
  sessionId: string,
  userId?: string,
): Promise<SessionWorkoutItem[]> {
  const client = getSupabaseClient();
  if (!client) {
    return [];
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return [];
  }

  const { data, error } = await client
    .from(getWorkoutItemsTableName())
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", resolvedUserId)
    .order("sort_order", { ascending: true })
    .order("item_index", { ascending: true });

  if (error) {
    logger.warn("[Supabase] Could not load workout rows", error);
    return [];
  }

  return (Array.isArray(data) ? data : [])
    .map((row) => normalizeWorkoutItemRecord(row))
    .filter((entry): entry is SessionWorkoutItem => Boolean(entry));
}

export async function saveWorkoutItemsForSession(
  sessionId: string,
  workoutItems: SessionWorkoutItem[],
  userId?: string,
) {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false as const,
      error: new Error("Supabase client is not available"),
    };
  }

  const resolvedUserId = userId || (await getAuthenticatedUserId(client));
  if (!resolvedUserId) {
    return {
      success: false as const,
      error: new Error(
        "Unable to resolve the authenticated user for workout persistence",
      ),
    };
  }

  await loadWorkoutItemsForSession(sessionId, resolvedUserId);

  const payload = buildWorkoutItemsPersistencePayloads({
    sessionId,
    userId: resolvedUserId,
    parentSessionRowId: sessionId,
    workoutItems,
  });

  if (payload.length === 0) {
    const { error } = await client
      .from(getWorkoutItemsTableName())
      .delete()
      .eq("session_id", sessionId)
      .eq("user_id", resolvedUserId);

    return error
      ? { success: false as const, error }
      : { success: true as const };
  }

  const { error } = await client
    .from(getWorkoutItemsTableName())
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", resolvedUserId);

  if (error) {
    logger.warn(
      "[Supabase] Could not clear existing workout rows before save",
      error,
    );
    return { success: false as const, error };
  }

  const { error: insertError } = await client
    .from(getWorkoutItemsTableName())
    .insert(payload);

  if (insertError) {
    logger.warn("[Supabase] Could not save workout rows", insertError);
    return { success: false as const, error: insertError };
  }

  if (error) {
    logger.warn("[Supabase] Could not save workout rows", error);
    return { success: false as const, error };
  }

  return { success: true as const };
}
