import type { Tables, TablesInsert } from "./databaseTypes";
import type { TableNames } from "./tableNames";

export type AppSetting = Tables<typeof TableNames.AppSetting>;
export type AppState = Tables<typeof TableNames.AppState>;
export type Assignment = Tables<typeof TableNames.Assignment>;
export type AuditLog = Tables<typeof TableNames.AuditLog>;
export type ErrorLog = Tables<typeof TableNames.ErrorLog>;
export type Favourite = Tables<typeof TableNames.Favourite>;
export type FavouriteFolder = Tables<typeof TableNames.FavouriteFolder>;
export type ImportedWorkout = Tables<typeof TableNames.ImportedWorkout>;
export type WorkoutTemplate = Tables<typeof TableNames.WorkoutTemplate>;
export type WorkoutTemplateExercise = Tables<
  typeof TableNames.WorkoutTemplateExercise
>;
export type WorkoutTemplateInsert = TablesInsert<
  typeof TableNames.WorkoutTemplate
>;
export type WorkoutPlanExercise = Tables<typeof TableNames.WorkoutPlanExercise>;
export type WorkoutTemplateExerciseInsert = TablesInsert<
  typeof TableNames.WorkoutTemplateExercise
>;

// Assuming 'Plan' is the application-level type that maps to WorkoutPlan
export type Plan = Tables<typeof TableNames.WorkoutPlan> & {
  planExercises: WorkoutPlanExercise[]; // Add this to reflect the new structure
  planName: string; // Ensure these are present if they are part of the application-level Plan type
  planSlug: string;
};
export type WorkoutPlan = Tables<typeof TableNames.WorkoutPlan>;
export type Profile = Tables<typeof TableNames.Profile>;
export type UserActivity = Tables<typeof TableNames.UserActivity>;
export type UserRole = Tables<typeof TableNames.UserRole>;
export type UserSession = Tables<typeof TableNames.UserSession>;
export type UserSessionWorkoutItem = Tables<
  typeof TableNames.UserSessionWorkoutItem
>;
