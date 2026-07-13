export type User = { id: string; name: string }

export type WeeklyDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export type PlanItem = {
  id: string
  name: string
  category: string
  body_part: string
  equipment: string
  instructions: {
    en: string
  }
  instruction_steps: {
    en: string[]
  }
  muscle_group: string
  secondary_muscles: string[]
  target: string
  image: string
  gif_url: string
  media_id: string
  created_at: string
  attribution: string
  note: string
  assignedDay?: WeeklyDay
}

export type SavedPlan = {
  id: string
  name: string
  items: PlanItem[]
}

export type AssignmentDayLog = {
  timeDone: string
  kwhUsed: string
  completedExercises: Record<string, string>
}

export type PlanPartWeek = {
  id: string
  weekLabel: string
  date: string
}

export type PlanPartExerciseEntry = {
  id: string
  exerciseId: string
  exerciseName: string
  reps: string
  workingSets: string
  weekValues: Record<string, string>
}

export type PlanPart = {
  id: string
  day: WeeklyDay
  planId: string
  planName: string
  weeks: PlanPartWeek[]
  exercises: PlanPartExerciseEntry[]
}

export type WorkoutPlan = {
  id: string
  name: string
  parts: PlanPart[]
}

export type Assignment = {
  id: string
  personName: string
  personSlug: string
  assignmentSlug: string
  planId: string
  planName: string
  completedExercises: Record<string, string>
  exercises: PlanItem[]
}
