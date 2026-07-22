import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  SessionWorkoutEditor,
  resolveExpandedWorkoutItemId,
} from './SessionWorkoutEditor'

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

  it('renders the exercise lookup picker in the quick-add area', () => {
    const markup = renderToStaticMarkup(
      <SessionWorkoutEditor items={[]} onChange={() => undefined} />,
    )

    expect(markup).toContain('quick-add-exercise-picker')
  })

  it('renders an explicit details control for workout items', () => {
    const markup = renderToStaticMarkup(
      <SessionWorkoutEditor
        items={[
          { id: 'item-1', category: 'exercise', exerciseName: 'Squat' } as any,
        ]}
        onChange={() => undefined}
      />,
    )

    expect(markup).toContain('Edit details')
  })
})
