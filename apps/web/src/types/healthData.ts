export interface HealthData {
  category_metrics: any[]
  date_range: DateRange
  export_date: string
  metadata: Metadata
  metrics: Metric[]
  workouts: Workout[]
}

export interface DateRange {
  days: number
  end: string
  start: string
}

export interface Metadata {
  aggregation_level: string
  app_version: string
  device_model: string
  export_format: string
  os_version: string
}

export interface Metric {
  aggregation_level: string
  category: string
  data_points: DataPoint[]
  display_name: string
  id: string
  unit?: string
}

export interface DataPoint {
  end_date: string
  source: Source
  start_date: string
  timestamp: string
  unit?: string
  value: number | string
}

export interface Source {
  name: string
  bundle_identifier?: string
  device?: string
}

export interface Workout {
  display_name: string
  duration: number
  end_date: string
  energy: number
  energy_unit: string
  id: string
  source: Source
  start_date: string
  type: string
}

export interface ActivityRingData {
  moveGoal: number // e.g., kcal or kJ
  moveProgress: number
  exerciseGoal: number // e.g., minutes
  exerciseProgress: number
  standGoal: number // e.g., hours or counts
  standProgress: number
}

export interface WorkoutTrendDataPoint {
  date: string // e.g., "2023-W01" for week 1 of 2023, or "2023-01" for Jan 2023
  value: number
}

export interface WorkoutTrend {
  id: string // e.g., "total_calories_weekly"
  name: string // e.g., "Total Calories Burned (Weekly)"
  unit: string // e.g., "kcal", "minutes"
  data: WorkoutTrendDataPoint[]
}

export interface AppleFitnessDashboardData {
  activityRings: ActivityRingData | null
  recentWorkouts: Workout[]
  workoutTrends: WorkoutTrend[] // New field
}

// Note: The Workout interface already exists and is more comprehensive,
// so we'll use that one and ensure mock data matches it.
