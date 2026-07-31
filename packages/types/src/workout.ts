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
