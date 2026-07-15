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
}

export type User = {
  id: string
  name: string
  slug: string
}

export type Plan = {
  id: string
  planName: string
  planSlug: string
  personName?: string
  personSlug?: string
  assignedPeople?: string[]
  assignedUserIds?: string[]
  assignedUserId?: string
  completedExercises?: Record<string, string>
  exercises: PlanItem[]
}
