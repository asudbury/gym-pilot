import { getItem, getItems, getSupabaseClient } from "./supabaseCore";
import { TableNames } from "./tableNames";
import type { ImportedWorkout } from "./types";

const tableName = TableNames.ImportedWorkout;

export async function getImportedWorkouts(
  userId: string,
  options?: { date?: string },
): Promise<{ data: ImportedWorkout[] | null; error: any | null }> {
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

export async function getImportedWorkout(
  userId: string,
  id: string,
): Promise<{ data: ImportedWorkout | null; error: any | null }> {
  return getItem<ImportedWorkout>(tableName, {
    userId,
    id,
  });
}

export async function updateImportedWorkout(
  workout: ImportedWorkout,
): Promise<{ data: any[] | null; error: any | null }> {
  const client = getSupabaseClient();

  return await client
    .from(tableName)
    .upsert(workout, { onConflict: "id" })
    .select()
    .single();
}
