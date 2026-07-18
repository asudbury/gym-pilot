import type { Assignment, Plan } from '@gym-pilot/types'
import { exercises } from '@gym-pilot/shared'

export type PlanDetailItem = {
  id: string
  exercise_id: string
  exercise_name: string
}

export type PlanDetailSession = {
  id: string
  title: string
  planItems: PlanDetailItem[]
}

export type PlanDetailViewModel = {
  title: string
  description: string
  editPath: string
  backPath: string
  editLabel: string
  backLabel: string
  sessions: PlanDetailSession[]
}

export function resolvePlanDetailViewModel(plan: Plan | undefined, assignment: Assignment | undefined, planSlug: string | undefined) {
  const isAssignment = Boolean(assignment)
  const resolvedPlanName = assignment?.planName ?? plan?.planName ?? 'Untitled plan'
  const sessions = (assignment?.planSessions && assignment.planSessions.length > 0)
    ? assignment.planSessions as unknown as PlanDetailSession[]
    : ((plan?.planSessions ?? []) as PlanDetailSession[])

  return {
    title: assignment?.assignmentName ?? plan?.planName ?? 'Untitled plan',
    description: resolvedPlanName,
    editPath: isAssignment
      ? `/users/${assignment?.assignedUserId ?? 'user'}/assignments/${assignment?.id ?? planSlug}/edit`
      : `/plans/${plan?.id ?? planSlug}/edit`,
    backPath: isAssignment ? `/users/${assignment?.assignedUserId ?? 'user'}/assignments` : '/plans',
    editLabel: isAssignment ? 'Edit assignment' : 'Edit plan',
    backLabel: isAssignment ? 'Back to assignments' : 'Back to plans',
    sessions,
  } satisfies PlanDetailViewModel
}

export function resolveExerciseForPlanItem(item: PlanDetailItem) {
  return exercises.find((exercise) => exercise.id === item.exercise_id || exercise.id === item.id || exercise.name === item.exercise_name)
}
