import type { Tables } from "./databaseTypes";

export type AppSetting = Tables<"gym_pilot_app_setting">;
export type AppState = Tables<"gym_pilot_app_state">;
export type Assignment = Tables<"gym_pilot_assignment">;
export type AuditLog = Tables<"gym_pilot_audit_log">;
export type ErrorLog = Tables<"gym_pilot_error_log">;
export type Favourite = Tables<"gym_pilot_favourite">;
export type FavouriteFolder = Tables<"gym_pilot_favourite_folder">;
export type Plan = Tables<"gym_pilot_plan">;
export type Profile = Tables<"gym_pilot_profile">;
export type UserActivity = Tables<"gym_pilot_user_activity">;
export type UserRole = Tables<"gym_pilot_user_role">;
export type UserSession = Tables<"gym_pilot_user_session">;
export type UserSessionWorkoutItem = Tables<"gym_pilot_user_session_workout_item">;
