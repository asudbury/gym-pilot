import { type PostgrestError } from "@supabase/supabase-js";
import { getItem, getItems, getSupabaseClient } from "./supabaseCore";
import { TableNames } from "./tableNames";
import type { ImportedWorkout } from "./types";

const tableName = TableNames.ImportedWorkout;

/** Retrieves imported workouts for `userId`, with optional date filter on `start_date`, ordered by date ascending. */
export async function getImportedWorkouts(
  userId: string,
  options?: { date?: string },
): Promise<{ data: ImportedWorkout[] | null; error: PostgrestError | null }> {
  return getItems<ImportedWorkout>(tableName, {
    userId,
    dateOnlyFilter: options?.date
      ? {
          column: "start_date",
          value: options.date,
        }
      : undefined,
    orderBy: {
      column: "start_date",
      options: { ascending: true },
    },
  });
}

/** Retrieves a single imported workout by `id` scoped to `userId`. */
export async function getImportedWorkout(
  userId: string,
  id: string,
): Promise<{ data: ImportedWorkout | null; error: PostgrestError | null }> {
  return getItem<ImportedWorkout>(tableName, {
    userId,
    id,
  });
}

/** Upserts (insert-or-update) a full `ImportedWorkout` row by `id`. */
export async function updateImportedWorkout(
  workout: ImportedWorkout,
): Promise<{ data: unknown[] | null; error: PostgrestError | null }> {
  const client = getSupabaseClient();

  return await client
    .from(tableName)
    .upsert(workout, { onConflict: "id" })
    .select()
    .single();
}
