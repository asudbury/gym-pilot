import type { Assignment, Plan } from '@gym-pilot/types'
import { createUUID } from '@gym-pilot/shared/src/utils'

export type AssignmentCreatePayload = {
  assignment: {
    id: string
    user_id: string
    assignment_name: string
    assigned_to_user_id: string | null
    allocated_by_user_id: string | null
    description: string | null
    goal: string | null
    notes: string | null
    source_plan_id: string
    created_at: string
    updated_at: string
  }
  sessions: Array<{
    id: string
    assignment_id: string
    name: string
    position: number
    goal: string | null
    notes: string | null
    created_at: string
    updated_at: string
  }>
  exercises: Array<{
    id: string
    assignment_id: string
    assignment_session_id: string
    exercise_id: string
    exercise_name: string | null
    position: number
    reps: string | null
    weight: string | null
    notes: string | null
    goal: string | null
    created_at: string
    updated_at: string
  }>
}

export type AssignmentCreateInput = {
  plan: Plan
  assignmentName: string
  creatorUserId: string
  assigneeUserId?: string | null
  allocatedByUserId?: string | null
  description?: string | null
  goal?: string | null
  notes?: string | null
}

export function buildAssignmentCreatePayload(
  input: AssignmentCreateInput,
): AssignmentCreatePayload {
  const now = new Date().toISOString()
  const assignmentId = createUUID()

  const sessions = (input.plan.planSessions ?? []).map((session, index) => ({
    id: createUUID(),
    assignment_id: assignmentId,
    name: session.name?.trim() || session.title?.trim() || `Day ${index + 1}`,
    position: session.position ?? index + 1,
    goal: input.goal ?? null,
    notes: input.notes ?? null,
    created_at: now,
    updated_at: now,
  }))

  const exercises = sessions.flatMap((session, sessionIndex) => {
    const sourceSession = (input.plan.planSessions ?? [])[sessionIndex]

    return (sourceSession?.planItems ?? []).map((exercise, exerciseIndex) => ({
      id: createUUID(),
      assignment_id: assignmentId,
      assignment_session_id: session.id,
      exercise_id: exercise.exercise_id || exercise.id || '',
      exercise_name: exercise.exercise_name ?? exercise.name ?? null,
      position: exercise.position ?? exerciseIndex + 1,
      reps: exercise.reps ?? null,
      weight: exercise.weight ?? null,
      notes: exercise.notes ?? null,
      goal: exercise.goal ?? input.goal ?? null,
      created_at: now,
      updated_at: now,
    }))
  })

  return {
    assignment: {
      id: assignmentId,
      user_id: input.creatorUserId,
      assignment_name:
        input.assignmentName.trim() || input.plan.planName || 'Untitled assignment',
      assigned_to_user_id: input.assigneeUserId ?? null,
      allocated_by_user_id: input.allocatedByUserId ?? null,
      description: input.description ?? null,
      goal: input.goal ?? null,
      notes: input.notes ?? null,
      source_plan_id: input.plan.id,
      created_at: now,
      updated_at: now,
    },
    sessions,
    exercises,
  }
}

export async function createAssignmentFromPlan(
  input: AssignmentCreateInput,
  client: { from: (table: string) => any },
): Promise<Assignment> {
  const payload = buildAssignmentCreatePayload(input)

  const { data: assignmentData, error: assignmentError } = await client
    .from('workout_assignment')
    .insert(payload.assignment)
    .select('id')
    .maybeSingle()

  if (assignmentError || !assignmentData?.id) {
    throw assignmentError ?? new Error('Failed to create assignment')
  }

  const sessionRows = payload.sessions.map((session) => ({
    ...session,
    assignment_id: assignmentData.id,
  }))

  if (sessionRows.length > 0) {
    const { error: sessionError } = await client
      .from('workout_assignment_session')
      .insert(sessionRows)

    if (sessionError) {
      throw sessionError
    }
  }

  const exerciseRows = payload.exercises.map((exercise) => ({
    ...exercise,
    assignment_id: assignmentData.id,
  }))

  if (exerciseRows.length > 0) {
    const { error: exerciseError } = await client
      .from('workout_assignment_exercise')
      .insert(exerciseRows)

    if (exerciseError) {
      throw exerciseError
    }
  }

  return {
    id: assignmentData.id,
    assignmentName: payload.assignment.assignment_name,
    planId: payload.assignment.source_plan_id,
    planName: input.plan.planName,
    planSessions: input.plan.planSessions?.map((session) => ({
      ...session,
      title: session.title ?? session.name ?? 'Day 1',
      planItems: (session.planItems ?? []).map((item) => ({
        ...item,
        exercise_id: item.exercise_id || item.id || '',
        exercise_name: item.exercise_name ?? item.name ?? 'Untitled exercise',
      })),
    })),
    assignedUserId: input.assigneeUserId ?? undefined,
    allocatedByUserId: input.allocatedByUserId ?? undefined,
    description: input.description ?? undefined,
    goal: input.goal ?? undefined,
    notes: input.notes ?? undefined,
  } as Assignment
}
