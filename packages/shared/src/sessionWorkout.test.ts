import { describe, expect, it } from 'vitest'
import {
  addSessionWorkoutItem,
  buildSessionWorkoutMetadata,
  buildWorkoutItemsFromPlanSessions,
  normalizeSessionWorkoutCategory,
  parseSessionWorkoutMetadata,
  removeSessionWorkoutItem,
  reorderSessionWorkoutItem,
  summarizeSessionWorkoutItem,
  updateSessionWorkoutItem,
} from './sessionWorkout'

describe('session workout helpers', () => {
  it('maps plan items into session workout entries', () => {
    const items = buildWorkoutItemsFromPlanSessions([
      {
        id: 'session-1',
        title: 'Day 1',
        planItems: [
          {
            id: 'plan-item-1',
            exercise_id: 'exercise-1',
            exercise_name: 'Back squat',
            reps: '3',
            workingSets: '4',
            notes: 'Heavy',
          },
        ],
      },
    ])

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      category: 'exercise',
      exerciseName: 'Back squat',
      exerciseId: 'exercise-1',
      reps: '3',
      sets: '4',
      notes: 'Heavy',
    })
  })

  it('serialises and parses workout metadata for persistence', () => {
    const metadata = buildSessionWorkoutMetadata({
      workoutItems: [
        {
          id: 'item-1',
          category: 'warm_up',
          exerciseName: 'Mobility',
          durationMinutes: '8',
          notes: 'Dynamic',
        },
      ],
      endedAt: '2026-07-21T12:30:00.000Z',
      activeKwh: '42',
      selectedPlanId: 'plan-1',
      selectedPlanName: 'Strength plan',
    })

    expect(metadata).toMatchObject({
      workout: {
        endedAt: '2026-07-21T12:30:00.000Z',
        activeKwh: '42',
        selectedPlanId: 'plan-1',
        selectedPlanName: 'Strength plan',
      },
    })

    expect(parseSessionWorkoutMetadata(metadata)).toMatchObject({
      endedAt: '2026-07-21T12:30:00.000Z',
      activeKwh: '42',
      selectedPlanId: 'plan-1',
      selectedPlanName: 'Strength plan',
      workoutItems: [
        expect.objectContaining({
          exerciseName: 'Mobility',
          category: 'warm_up',
        }),
      ],
    })
  })

  it('parses direct workout item metadata from older session payloads', () => {
    const parsed = parseSessionWorkoutMetadata({
      workoutItems: [
        {
          id: 'item-2',
          category: 'exercise',
          exerciseName: 'Deadlift',
          reps: '5',
          sets: '3',
        },
      ],
      endedAt: '2026-07-21T13:00:00.000Z',
    })

    expect(parsed.workoutItems).toHaveLength(1)
    expect(parsed.workoutItems[0]).toMatchObject({
      exerciseName: 'Deadlift',
      category: 'exercise',
    })
  })

  it('summarises workout items for compact mobile views', () => {
    const summary = summarizeSessionWorkoutItem({
      id: 'item-1',
      category: 'exercise',
      exerciseName: 'Back squat',
      sets: '4',
      reps: '5',
      durationMinutes: '20',
    })

    expect(summary).toBe('Back squat • 4 × 5 • 20 min')
  })

  it('supports reordering workout items', () => {
    const baseItems = [
      {
        id: 'item-1',
        category: 'exercise' as const,
        exerciseName: 'Squat',
        sortOrder: 0,
      },
      {
        id: 'item-2',
        category: 'exercise' as const,
        exerciseName: 'Deadlift',
        sortOrder: 1,
      },
    ]

    const reordered = reorderSessionWorkoutItem(baseItems, 'item-1', 'down')

    expect(reordered[0].id).toBe('item-2')
    expect(reordered[1].id).toBe('item-1')
    expect(reordered[0].sortOrder).toBe(0)
    expect(reordered[1].sortOrder).toBe(1)
  })

  it('keeps sort order values aligned after sequential reorders', () => {
    const baseItems = [
      {
        id: 'item-1',
        category: 'exercise' as const,
        exerciseName: 'Squat',
        sortOrder: 0,
      },
      {
        id: 'item-2',
        category: 'exercise' as const,
        exerciseName: 'Deadlift',
        sortOrder: 1,
      },
      {
        id: 'item-3',
        category: 'exercise' as const,
        exerciseName: 'Row',
        sortOrder: 2,
      },
    ]

    const movedUp = reorderSessionWorkoutItem(baseItems, 'item-2', 'up')
    const movedDown = reorderSessionWorkoutItem(movedUp, 'item-1', 'down')

    expect(movedDown.map((item) => item.id)).toEqual(['item-2', 'item-3', 'item-1'])
    expect(movedDown.map((item) => item.sortOrder)).toEqual([0, 1, 2])
  })

  it('supports adding, updating, and removing workout items', () => {
    const baseItems = [
      {
        id: 'item-1',
        category: 'exercise' as const,
        exerciseName: 'Squat',
        reps: '3',
        sets: '4',
      },
    ]

    const added = addSessionWorkoutItem(baseItems, {
      category: 'spin',
      exerciseName: 'Indoor ride',
    })

    expect(added).toHaveLength(2)
    expect(added[1]).toMatchObject({
      category: 'spin',
      exerciseName: 'Indoor ride',
    })

    const updated = updateSessionWorkoutItem(added, added[1].id, {
      durationMinutes: '30',
      notes: 'Great session',
    })

    expect(updated[1]).toMatchObject({
      durationMinutes: '30',
      notes: 'Great session',
    })

    const removed = removeSessionWorkoutItem(updated, added[1].id)
    expect(removed).toHaveLength(1)
    expect(removed[0].id).toBe('item-1')
  })

  it('normalizes spin as a supported workout category', () => {
    expect(normalizeSessionWorkoutCategory('spin')).toBe('spin')
    expect(normalizeSessionWorkoutCategory('Spin')).toBe('spin')
    expect(normalizeSessionWorkoutCategory('unknown')).toBe('exercise')
  })
})
