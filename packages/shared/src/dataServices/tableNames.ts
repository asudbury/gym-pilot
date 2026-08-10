export const TableNames = {
  AppSetting: "app_setting",
  AppState: "app_state",
  AuditLog: "audit_log",
  ErrorLog: "error_log",
  Favourite: "favourite",
  FavouriteFolder: "favourite_folder",
  ImportedWorkout: "imported_workout",
  WorkoutAssignment: "workout_assignment",
  WorkoutAssignmentSession: "workout_assignment_session",
  WorkoutAssignmentExercise: "workout_assignment_exercise",
  WorkoutTemplate: "workout_template",
  WorkoutTemplateExercise: "workout_template_exercise",
  WorkoutPlan: "workout_plan",
  WorkoutPlanExercise: "workout_plan_exercise",
  WorkoutPlanSession: "workout_plan_session",
  Profile: "gym_pilot_profile",
  UserActivity: "user_activity",
  UserRole: "gym_pilot_user_role",
  UserSession: "user_workout",
  UserSessionWorkoutItem: "gym_pilot_user_session_workout_item",
} as const;

export type TableName = (typeof TableNames)[keyof typeof TableNames];
