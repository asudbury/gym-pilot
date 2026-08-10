import { describe, expect, it } from 'vitest'
import { mapWorkoutAssignmentRows } from './assignmentView'

describe('mapWorkoutAssignmentRows', () => {
  it('maps Supabase assignment rows into the list view model', () => {
    const rows = [
      {
        id: 'assignment-1',
        assignment_name: 'Strength Plan',
        assigned_to_user_id: 'user-1',
        description: 'For the next 4 weeks',
        goal: 'Build strength',
        created_at: '2026-08-10T12:00:00.000Z',
        updated_at: '2026-08-10T13:00:00.000Z',
      },
    ]

    expect(mapWorkoutAssignmentRows(rows)).toEqual([
      {
        id: 'assignment-1',
        assignmentName: 'Strength Plan',
        assigneeUserId: 'user-1',
        description: 'For the next 4 weeks',
        goal: 'Build strength',
        createdAt: '2026-08-10T12:00:00.000Z',
        updatedAt: '2026-08-10T13:00:00.000Z',
      },
    ])
  })
})
