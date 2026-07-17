import type { PlanSession } from './plan'

export type Assignment = {
  id: string
  assignmentName: string
  planId: string
  planName?: string
  planSlug?: string
  planSessions?: PlanSession[]
  assignedUserId?: string
  assignedUserName?: string
  completedExercises?: Record<string, string>
}
