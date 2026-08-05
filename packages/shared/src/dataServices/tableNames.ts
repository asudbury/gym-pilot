export const TableNames = {
  AppSetting: "app_setting",
  AppState: "gym_pilot_app_state",
  Assignment: "gym_pilot_assignment",
  AuditLog: "audit_log",
  ErrorLog: "error_log",
  Favourite: "favourite",
  FavouriteFolder: "favourite_folder",
  ImportedWorkout: "imported_workout",
  Plan: "gym_pilot_plan",
  Profile: "gym_pilot_profile",
  UserActivity: "user_activity",
  UserRole: "gym_pilot_user_role",
  UserSession: "gym_pilot_user_session",
  UserSessionWorkoutItem: "gym_pilot_user_session_workout_item",
} as const;

export type TableName = (typeof TableNames)[keyof typeof TableNames];
