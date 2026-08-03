import type { Assignment, Plan } from '@gym-pilot/types'

export type PlanListCardViewModel = {
  id: string
  title: string
  subtitle: string
  viewPath: string
  editPath: string
}

export function resolvePlanListViewModels(
  plans: Plan[],
): PlanListCardViewModel[] {
  return plans.map((plan) => ({
    id: plan.id,
    title: plan.planName || 'Untitled plan',
    subtitle: 'Base plan',
    viewPath: `/plans/${plan.planSlug ?? plan.id}`,
    editPath: `/plans/${plan.planSlug ?? plan.id}/edit`,
  }))
}

export function resolveAssignmentListViewModels(
  assignments: Assignment[],
): PlanListCardViewModel[] {
  return assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.assignmentName || 'Untitled assignment',
    subtitle: assignment.assignedUserName
      ? `Assigned to ${assignment.assignedUserName}`
      : 'No user assigned',
    viewPath: `/users/${assignment.assignedUserId ?? 'user'}/assignments/${assignment.id}`,
    editPath: `/users/${assignment.assignedUserId ?? 'user'}/assignments/${assignment.id}/edit`,
  }))
}
