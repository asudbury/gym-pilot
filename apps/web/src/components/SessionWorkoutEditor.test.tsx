import { describe, expect, it } from 'vitest'
import { resolveExpandedWorkoutItemId } from './SessionWorkoutEditor'

describe('resolveExpandedWorkoutItemId', () => {
  it('keeps the current active id when it still exists', () => {
    const items = [
      { id: 'item-1', category: 'exercise', exerciseName: 'Squat' },
      { id: 'item-2', category: 'exercise', exerciseName: 'Run' },
    ] as any

    expect(resolveExpandedWorkoutItemId(items, 'item-2')).toBe('item-2')
  })

  it('falls back to the first available item when the active id is no longer present', () => {
    const items = [
      { id: 'item-1', category: 'exercise', exerciseName: 'Squat' },
      { id: 'item-2', category: 'exercise', exerciseName: 'Run' },
    ] as any

    expect(resolveExpandedWorkoutItemId(items, 'missing-item')).toBe('item-1')
  })

  it('returns null when there are no items', () => {
    expect(resolveExpandedWorkoutItemId([], 'item-1')).toBeNull()
  })
})
