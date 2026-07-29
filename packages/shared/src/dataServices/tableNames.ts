export const TableNames = {
  AppSetting: "gym_pilot_app_setting",
  AppState: "gym_pilot_app_state",
  Assignment: "gym_pilot_assignment",
  AuditLog: "gym_pilot_audit_log",
  ErrorLog: "gym_pilot_error_log",
  Favourite: "gym_pilot_favourite",
  FavouriteFolder: "gym_pilot_favourite_folder",
  ImportedWorkout: "gym_pilot_imported_workout",
  Plan: "gym_pilot_plan",
  Profile: "gym_pilot_profile",
  UserActivity: "gym_pilot_user_activity",
  UserRole: "gym_pilot_user_role",
  UserSession: "gym_pilot_user_session",
  UserSessionWorkoutItem: "gym_pilot_user_session_workout_item",
} as const;

export type TableName = typeof TableNames[keyof typeof TableNames];

