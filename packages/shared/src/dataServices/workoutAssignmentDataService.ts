import { createUUID } from "../utils";

export type WorkoutAssignmentPlanSessionInput = {
  id?: string;
  name?: string;
  position?: number;
  goal?: string | null;
  notes?: string | null;
  exercises?: WorkoutAssignmentPlanExerciseInput[];
};

export type WorkoutAssignmentPlanExerciseInput = {
  id?: string;
  exercise_id?: string;
  exercise_name?: string | null;
  position?: number;
  reps?: string | null;
  weight?: string | null;
  notes?: string | null;
  goal?: string | null;
};

export type WorkoutAssignmentCopyInput = {
  plan: {
    id: string;
    plan_name: string;
    plan_sessions?: WorkoutAssignmentPlanSessionInput[];
  };
  assignmentName: string;
  creatorUserId: string;
  assigneeUserId?: string | null;
  allocatedByUserId?: string | null;
  description?: string | null;
  goal?: string | null;
  notes?: string | null;
};

export type WorkoutAssignmentCopyPayload = {
  assignment: {
    id: string;
    user_id: string;
    assignment_name: string;
    assigned_to_user_id: string | null;
    allocated_by_user_id: string | null;
    description: string | null;
    goal: string | null;
    notes: string | null;
    source_plan_id: string;
    created_at: string;
    updated_at: string;
  };
  sessions: Array<{
    id: string;
    assignment_id: string;
    name: string;
    position: number;
    goal: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }>;
  exercises: Array<{
    id: string;
    assignment_id: string;
    assignment_session_id: string;
    exercise_id: string;
    exercise_name: string | null;
    position: number;
    reps: string | null;
    weight: string | null;
    notes: string | null;
    goal: string | null;
    created_at: string;
    updated_at: string;
  }>;
};

export function buildWorkoutAssignmentCopyPayload(
  input: WorkoutAssignmentCopyInput,
): WorkoutAssignmentCopyPayload {
  const now = new Date().toISOString();
  const assignmentId = createUUID();

  const sessions = (input.plan.plan_sessions ?? []).map((session, index) => ({
    id: session.id ?? createUUID(),
    assignment_id: assignmentId,
    name: session.name?.trim() || `Day ${index + 1}`,
    position: session.position ?? index + 1,
    goal: session.goal ?? input.goal ?? null,
    notes: session.notes ?? input.notes ?? null,
    created_at: now,
    updated_at: now,
  }));

  const exercises = sessions.flatMap((session) => {
    const sourceSession =
      (input.plan.plan_sessions ?? [])[sessions.indexOf(session)] ?? undefined;
    const sessionExercises = sourceSession?.exercises ?? [];

    return sessionExercises.map((exercise, exerciseIndex) => ({
      id: exercise.id ?? createUUID(),
      assignment_id: assignmentId,
      assignment_session_id: session.id,
      exercise_id: exercise.exercise_id ?? "",
      exercise_name: exercise.exercise_name ?? null,
      position: exercise.position ?? exerciseIndex + 1,
      reps: exercise.reps ?? null,
      weight: exercise.weight ?? null,
      notes: exercise.notes ?? null,
      goal: exercise.goal ?? input.goal ?? null,
      created_at: now,
      updated_at: now,
    }));
  });

  return {
    assignment: {
      id: assignmentId,
      user_id: input.creatorUserId,
      assignment_name: input.assignmentName.trim() || input.plan.plan_name,
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
  };
}
