import { getSupabaseClient } from "./supabase";
import { logger } from "./logging";
import { getAuthenticatedUserId } from "./supabaseAuth";
import { type UserSessionWorkoutItem } from "./dataServices/types";

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

export function getWorkoutItemsTableName() {
  return "gym_pilot_user_session_workout_item";
}

export async function loadWorkoutItemsForSession(
  sessionId: string,
  userId?: string,
): Promise<UserSessionWorkoutItem[]> {
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

  return (Array.isArray(data) ? data : []) as UserSessionWorkoutItem[];
}

export async function saveWorkoutItemsForSession(
  sessionId: string,
  workoutItems: Partial<UserSessionWorkoutItem>[],
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

  // Delete existing items for the session
  const { error: deleteError } = await client
    .from(getWorkoutItemsTableName())
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", resolvedUserId);

  if (deleteError) {
    logger.warn(
      "[Supabase] Could not clear existing workout rows before save",
      deleteError,
    );
    return { success: false as const, error: deleteError };
  }

  if (workoutItems.length === 0) {
    return { success: true as const };
  }
  
  const normalizedItems = workoutItems.map((item, index) => ({
    ...item,
    id: item.id || `item-${index}`,
    sort_order: typeof item.sort_order === "number" ? item.sort_order : index,
    originalIndex: index,
  }));

  const orderedItems = [...normalizedItems].sort((left, right) => {
    const leftSortOrder =
      typeof left.sort_order === "number" ? left.sort_order : left.originalIndex;
    const rightSortOrder =
      typeof right.sort_order === "number"
        ? right.sort_order
        : right.originalIndex;

    if (leftSortOrder !== rightSortOrder) {
      return leftSortOrder - rightSortOrder;
    }

    return left.originalIndex - right.originalIndex;
  });
  
  const payload = orderedItems.map((item, index) => ({
    ...item,
    session_id: sessionId,
    user_id: resolvedUserId,
    session_row_id: normalizeSessionRowId(sessionId),
    sort_order: index,
    item_index: item.item_index ?? index,
    created_at: item.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));


  const { error: insertError } = await client
    .from(getWorkoutItemsTableName())
    .insert(payload as unknown as UserSessionWorkoutItem[]);

  if (insertError) {
    logger.warn("[Supabase] Could not save workout rows", insertError);
    return { success: false as const, error: insertError };
  }

  return { success: true as const };
}
