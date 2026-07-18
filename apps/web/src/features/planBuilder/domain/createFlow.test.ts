import { describe, expect, it } from 'vitest'
import { hasBuilderContent, resolveCreateFlowViewModel } from './createFlow'

describe('resolveCreateFlowViewModel', () => {
  it('returns assignment-focused labels for assignment routes', () => {
    expect(resolveCreateFlowViewModel({ isAssignmentRoute: true, isEditMode: false })).toMatchObject({
      title: 'Create a new assignment',
      backLabel: 'Back to assignments',
      saveLabel: 'Create assignment',
      planNamePlaceholder: 'Plan name',
    })
  })

  it('returns plan-focused labels for plan routes', () => {
    expect(resolveCreateFlowViewModel({ isAssignmentRoute: false, isEditMode: true })).toMatchObject({
      title: 'Edit plan',
      backLabel: 'Back to plans',
      saveLabel: 'Save changes',
      planNamePlaceholder: 'Plan name',
    })
  })
})

describe('hasBuilderContent', () => {
  it('returns true when any session has items', () => {
    expect(hasBuilderContent([{ planItems: [] }, { planItems: [{ id: 'row-1' }] }])).toBe(true)
  })

  it('returns false when no session contains items', () => {
    expect(hasBuilderContent([{ planItems: [] }, { planItems: [] }])).toBe(false)
  })
})
