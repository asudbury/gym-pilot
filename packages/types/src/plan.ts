export type PlanItem = {
  id: string
  exercise_id: string
  exercise_name: string
  reps: string
  workingSets: string
  notes: string
}

export type PlanSession = {
  id: string
  title: string
  planItems: PlanItem[]
}

export type Plan = {
  id: string
  planName: string
  planSlug: string
  planSessions: PlanSession[]
  createdByUserId?: string
}
