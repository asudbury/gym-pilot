import type { Assignment, Plan } from '@gym-pilot/types'

export type PlanRouteSelection = {
  plan: Plan | undefined
  assignment: Assignment | undefined
}

export function resolvePlanRouteSelection(
  plans: Plan[],
  assignments: Assignment[],
  planSlug: string | undefined,
) {
  const plan = plans.find((item) => item.planSlug === planSlug)
  const assignment = assignments.find((item) => item.id === planSlug)

  return {
    plan,
    assignment,
  } satisfies PlanRouteSelection
}

export function resolveAssignmentRouteSelection(
  plans: Plan[],
  assignments: Assignment[],
  planSlug: string | undefined,
) {
  const assignment = assignments.find((item) => item.id === planSlug)
  const plan = plans.find((item) => item.id === assignment?.planId)

  return {
    plan,
    assignment,
  } satisfies PlanRouteSelection
}
