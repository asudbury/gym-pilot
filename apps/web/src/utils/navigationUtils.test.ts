import { describe, expect, it } from 'vitest'
import { buildNavigationMenuItems } from './navigationUtils'

describe('buildNavigationMenuItems', () => {
  it('omits the timetable link when timetable is disabled', () => {
    const items = buildNavigationMenuItems({
      plansCount: 0,
      assignmentsCount: 0,
      isAuthenticated: true,
      showTimetable: false,
      itemClassName: 'test',
    })

    expect(items.some((item) => item.label === 'Timetable')).toBe(false)
  })

  it('hides navigation items that are not visible for the current tier and device', () => {
    const items = buildNavigationMenuItems({
      plansCount: 0,
      assignmentsCount: 0,
      isAuthenticated: true,
      showTimetable: true,
      itemClassName: 'test',
      tier: 'free',
      deviceType: 'mobile',
    })

    expect(items.some((item) => item.label === 'Exercises')).toBe(true)
    expect(items.some((item) => item.label === 'Record Session')).toBe(false)
  })
})
