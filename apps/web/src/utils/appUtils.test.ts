import { describe, expect, it } from 'vitest'
import { formatDashboardTimestamp } from './appUtils'

describe('formatDashboardTimestamp', () => {
  it('returns today with the time for timestamps from the current day', () => {
    const now = new Date()
    const value = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30).toISOString()

    expect(formatDashboardTimestamp(value)).toContain('Today,')
  })

  it('returns yesterday with the time for timestamps from the previous day', () => {
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const value = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 9, 30).toISOString()

    expect(formatDashboardTimestamp(value)).toContain('Yesterday,')
  })
})
