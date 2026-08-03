import { describe, expect, it } from 'vitest'
import { createPlanBuilderInitialState } from './usePlanBuilderFeature'

describe('createPlanBuilderInitialState', () => {
  it('starts with a blank tab when there are no sessions provided', () => {
    const state = createPlanBuilderInitialState(undefined)

    expect(state.tabs).toHaveLength(1)
    expect(state.tabs[0]?.title).toBe('Day 1')
    expect(state.activeTabId).toBe(state.tabs[0]?.id ?? null)
  })

  it('hydrates tabs from existing sessions', () => {
    const state = createPlanBuilderInitialState([
      {
        id: 's1',
        title: 'Warm up',
        planItems: [
          {
            id: 'item-1',
            exercise_id: 'squat',
            exercise_name: 'Squat',
            reps: '3x10',
            workingSets: '3',
            notes: '',
          },
        ],
      },
    ])

    expect(state.tabs).toHaveLength(1)
    expect(state.tabs[0]?.title).toBe('Warm up')
    expect(state.tabs[0]?.rows).toHaveLength(1)
    expect(state.tabs[0]?.rows[0]?.exerciseId).toBe('squat')
  })
})
