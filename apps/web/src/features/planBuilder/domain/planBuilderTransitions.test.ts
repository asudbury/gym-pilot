import { describe, expect, it } from 'vitest'
import { resolvePlanBuilderTabState, resolvePlanBuilderResetState, resolvePlanBuilderHydrationState, resolvePlanBuilderLinkRows } from './planBuilderTransitions'
import { createBlankTab } from '../../../utils/planBuilderUtils'

describe('planBuilderTransitions', () => {
  it('creates a tab state with a new tab and selected exercise', () => {
    const state = resolvePlanBuilderTabState({ tabs: [createBlankTab('Day 1')], activeTabId: 'day-1', selectedExerciseId: 'ex1', selectedExerciseName: 'Bench press', personNamesInput: 'Team' }, 'Day 2')

    expect(state.tabs).toHaveLength(2)
    expect(state.activeTabId).toBeTruthy()
  })

  it('resolves reset state and link rows', () => {
    const resetState = resolvePlanBuilderResetState()
    const linkRows = resolvePlanBuilderLinkRows([{ label: 'Docs', path: '/docs' }, { label: '', path: '/skip' }], 'tab-1')

    expect(resetState.tabs[0]?.title).toBe('Day 1')
    expect(linkRows).toHaveLength(1)
  })

  it('hydrates from existing plan sessions', () => {
    const state = resolvePlanBuilderHydrationState({ planName: 'My plan', planSessions: [] })
    expect(state.personNamesInput).toBe('My plan')
  })
})
