import { getItems, getSupabaseClient } from "./supabaseCore";
import { TableNames } from "./tableNames";
import type { ImportedWorkout } from "./types";

const tableName = TableNames.ImportedWorkout;

export async function getImportedWorkouts(userId: string): 
  Promise<{ data: ImportedWorkout[] | null; error: any | null }> {
  
  return getItems<ImportedWorkout>(tableName, {
    userId,
    orderBy: {
      column: 'start_date',
      options: { ascending: false },
    },
  });
}

export async function updateImportedWorkout(workout: ImportedWorkout) : 
  Promise<{ data: any[] | null; error: any | null }> {

    const client = getSupabaseClient();
    
    return await client
      .from(tableName)
      .upsert(workout, { onConflict: "id" })
      .select()
      .single();
}
