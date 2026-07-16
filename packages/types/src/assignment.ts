export type Assignment = {
  id: string
  assignmentName: string
  planId: string
  assignedUserId?: string
  assignedUserName?: string
  completedExercises?: Record<string, string>
}
