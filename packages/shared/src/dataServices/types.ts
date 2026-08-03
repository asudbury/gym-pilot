import type { Tables } from "./databaseTypes";
import type { TableNames } from "./tableNames";

export type AppSetting = Tables<typeof TableNames.AppSetting>;
export type AppState = Tables<typeof TableNames.AppState>;
export type Assignment = Tables<typeof TableNames.Assignment>;
export type AuditLog = Tables<typeof TableNames.AuditLog>;
export type ErrorLog = Tables<typeof TableNames.ErrorLog>;
export type Favourite = Tables<typeof TableNames.Favourite>;
export type FavouriteFolder = Tables<typeof TableNames.FavouriteFolder>;
export type ImportedWorkout = Tables<typeof TableNames.ImportedWorkout>;
export type Plan = Tables<typeof TableNames.Plan>;
export type Profile = Tables<typeof TableNames.Profile>;
export type UserActivity = Tables<typeof TableNames.UserActivity>;
export type UserRole = Tables<typeof TableNames.UserRole>;
export type UserSession = Tables<typeof TableNames.UserSession>;
export type UserSessionWorkoutItem = Tables<typeof TableNames.UserSessionWorkoutItem>;
