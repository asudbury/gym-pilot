import type { Tables, TablesInsert, TablesUpdate } from "./databaseTypes";

export type AppSetting = Tables<"gym_pilot_app_setting">;
export type NewAppSetting = TablesInsert<"gym_pilot_app_setting">;
export type UpdateAppSettingRecord = TablesUpdate<"gym_pilot_app_setting">;

export type AppState = Tables<"gym_pilot_app_state">;
export type NewAppState = TablesInsert<"gym_pilot_app_state">;
export type UpdateAppState = TablesUpdate<"gym_pilot_app_state">;

export type Assignment = Tables<"gym_pilot_assignment">;
export type NewAssignment = TablesInsert<"gym_pilot_assignment">;
export type UpdateAssignment = TablesUpdate<"gym_pilot_assignment">;

export type AuditLog = Tables<"gym_pilot_audit_log">;
export type NewAuditLog = TablesInsert<"gym_pilot_audit_log">;
export type UpdateAuditLog = TablesUpdate<"gym_pilot_audit_log">;

export type ErrorLog = Tables<"gym_pilot_error_log">;
export type NewErrorLog = TablesInsert<"gym_pilot_error_log">;
export type UpdateErrorLog = TablesUpdate<"gym_pilot_error_log">;

export type Favourite = Tables<"gym_pilot_favourite">;
export type NewFavourite = TablesInsert<"gym_pilot_favourite">;
export type UpdateFavourite = TablesUpdate<"gym_pilot_favourite">;

export type FavouriteFolder = Tables<"gym_pilot_favourite_folder">;
export type NewFavouriteFolder = TablesInsert<"gym_pilot_favourite_folder">;
export type UpdateFavouriteFolder = TablesUpdate<"gym_pilot_favourite_folder">;

export type Plan = Tables<"gym_pilot_plan">;
export type NewPlan = TablesInsert<"gym_pilot_plan">;
export type UpdatePlan = TablesUpdate<"gym_pilot_plan">;

export type Profile = Tables<"gym_pilot_profile">;
export type NewProfile = TablesInsert<"gym_pilot_profile">;
export type UpdateProfile = TablesUpdate<"gym_pilot_profile">;

export type UserActivity = Tables<"gym_pilot_user_activity">;
export type NewUserActivity = TablesInsert<"gym_pilot_user_activity">;
export type UpdateUserActivity = TablesUpdate<"gym_pilot_user_activity">;

export type UserRole = Tables<"gym_pilot_user_role">;
export type NewUserRole = TablesInsert<"gym_pilot_user_role">;
export type UpdateUserRole = TablesUpdate<"gym_pilot_user_role">;

export type UserSession = Tables<"gym_pilot_user_session">;

export type UserSessionWorkoutItem = Tables<"gym_pilot_user_session_workout_item">;
export type NewUserSessionWorkoutItem = TablesInsert<"gym_pilot_user_session_workout_item">;
export type UpdateUserSessionWorkoutItem = TablesUpdate<"gym_pilot_user_session_workout_item">;