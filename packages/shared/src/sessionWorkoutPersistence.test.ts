import { describe, expect, it } from 'vitest'
import { buildWorkoutItemsPersistencePayloads } from './sessionWorkoutPersistence'

describe('session workout persistence payloads', () => {
  it('assigns unique item positions for each workout item payload', () => {
    const payloads = buildWorkoutItemsPersistencePayloads({
      sessionId: 'session-1',
      userId: 'user-1',
      workoutItems: [
        { id: 'item-1', category: 'exercise', exerciseName: 'Squat' } as any,
        { id: 'item-2', category: 'exercise', exerciseName: 'Run' } as any,
      ],
    })

    expect(payloads.map((payload) => payload.item_index)).toEqual([0, 1])
    expect(new Set(payloads.map((payload) => payload.id)).size).toBe(2)
  })
})
