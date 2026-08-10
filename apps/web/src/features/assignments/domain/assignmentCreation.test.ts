import { describe, expect, it } from 'vitest'
import { buildAssignmentCreatePayload } from './assignmentCreation'

describe('buildAssignmentCreatePayload', () => {
  it('builds relational assignment rows from a selected plan', () => {
    const payload = buildAssignmentCreatePayload({
      plan: {
        id: 'plan-1',
        planName: 'Strength plan',
        planSessions: [
          {
            id: 'session-1',
            name: 'Day 1',
            position: 1,
            planItems: [
              {
                id: 'exercise-1',
                exercise_id: 'bench-press',
                exercise_name: 'Bench press',
                position: 1,
                reps: '3x10',
                weight: '60kg',
              },
            ],
          },
        ],
      },
      assignmentName: 'Strength plan - Alex',
      creatorUserId: 'trainer-1',
      assigneeUserId: 'client-1',
      allocatedByUserId: 'trainer-1',
      description: 'Assigned from trainer',
      goal: 'Increase strength',
      notes: 'Keep it steady',
    })

    expect(payload.assignment.assignment_name).toBe('Strength plan - Alex')
    expect(payload.assignment.user_id).toBe('trainer-1')
    expect(payload.assignment.assigned_to_user_id).toBe('client-1')
    expect(payload.assignment.allocated_by_user_id).toBe('trainer-1')
    expect(payload.sessions).toHaveLength(1)
    expect(payload.exercises).toHaveLength(1)
    expect(payload.exercises[0]?.exercise_id).toBe('bench-press')
  })
})
