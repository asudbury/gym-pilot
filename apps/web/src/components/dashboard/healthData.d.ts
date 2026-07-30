export type Workout = {
  id: string
  display_name: string
  energy: number
  energy_unit: string // e.g., "kcal", "kJ"
  start_date: string // ISO 8601 string
  duration: number // in seconds
  // Add other relevant fields from HealthKit if known, e.g.,
  // workout_type: string;
  // total_distance?: number; // in meters
  // total_distance_unit?: string;
  // average_heart_rate?: number;
  // max_heart_rate?: number;
}

export type ActivityRingData = {
  moveGoal: number // e.g., kcal or kJ
  moveProgress: number
  exerciseGoal: number // e.g., minutes
  exerciseProgress: number
  standGoal: number // e.g., hours or counts
  standProgress: number
}

export type AppleFitnessDashboardData = {
  activityRings: ActivityRingData | null
  recentWorkouts: Workout[]
}
