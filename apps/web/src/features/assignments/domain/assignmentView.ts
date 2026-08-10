export type WorkoutAssignmentViewModel = {
  id: string
  assignmentName: string
  assigneeUserId?: string | null
  description?: string | null
  goal?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

export function mapWorkoutAssignmentRows(
  rows: Array<Partial<Record<string, unknown>>>,
): WorkoutAssignmentViewModel[] {
  return (rows ?? []).map((row) => ({
    id: String(row.id ?? ''),
    assignmentName: String(row.assignment_name ?? ''),
    assigneeUserId:
      (row.assigned_to_user_id as string | null | undefined) ?? null,
    description: (row.description as string | null | undefined) ?? null,
    goal: (row.goal as string | null | undefined) ?? null,
    createdAt: (row.created_at as string | null | undefined) ?? null,
    updatedAt: (row.updated_at as string | null | undefined) ?? null,
  }))
}
