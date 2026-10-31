import { describe, expect, it } from 'vitest'
import { buildNavigationMenuItems } from './navigationUtils'

describe('buildNavigationMenuItems', () => {
  it('shows the timetable link when not authenticated', () => {
    const items = buildNavigationMenuItems({
      isAuthenticated: false,
      itemClassName: 'test',
    })

    expect(items.some((item) => item.label === 'Timetable')).toBe(true)
  })

  it('hides navigation items that are not visible for the current tier and device', () => {
    const items = buildNavigationMenuItems({
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
