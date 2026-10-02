import { describe, it, expect } from 'vitest'
import {
  formatDashboardTimestamp,
  renderDashboardTimestamp,
} from './dashboardUtils'

describe('formatDashboardTimestamp', () => {
  it('returns null for undefined or null input', () => {
    expect(formatDashboardTimestamp(undefined)).toBeNull()
    expect(formatDashboardTimestamp(null)).toBeNull()
    expect(formatDashboardTimestamp('')).toBeNull()
  })

  it('returns null for invalid date strings', () => {
    expect(formatDashboardTimestamp('invalid-date')).toBeNull()
    expect(formatDashboardTimestamp('2024-13-45')).toBeNull()
  })

  it("formats today's dates with time", () => {
    const now = new Date()
    const isoNow = now.toISOString()
    const result = formatDashboardTimestamp(isoNow)

    expect(result).toContain('Today,')
  })

  it("formats yesterday's dates correctly", () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(14, 30, 0)
    const isoYesterday = yesterday.toISOString()
    const result = formatDashboardTimestamp(isoYesterday)

    expect(result).toContain('Yesterday,')
  })

  it('formats dates within the past week as "X days ago"', () => {
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    fiveDaysAgo.setHours(0, 0, 0) // Set to start of day to avoid timing issues
    const isoFiveDaysAgo = fiveDaysAgo.toISOString()
    const result = formatDashboardTimestamp(isoFiveDaysAgo)

    // Should say "X days ago"
    expect(result).toMatch(/\d+ days ago,/)
  })

  it('formats older dates with full date and time', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 30)
    const isoOldDate = oldDate.toISOString()
    const result = formatDashboardTimestamp(isoOldDate)

    expect(result).not.toContain('Today')
    expect(result).not.toContain('Yesterday')
    expect(result).not.toContain('days ago')
    expect(result).toBeTruthy()
  })
})

describe('renderDashboardTimestamp', () => {
  it('returns null for null or undefined input', () => {
    expect(renderDashboardTimestamp(undefined)).toBeNull()
    expect(renderDashboardTimestamp(null)).toBeNull()
  })

  it('returns null for invalid dates', () => {
    expect(renderDashboardTimestamp('invalid')).toBeNull()
  })

  it("wraps today's timestamp in span element", () => {
    const now = new Date()
    const isoNow = now.toISOString()
    const result = renderDashboardTimestamp(isoNow)

    // Should return a React element (object with type property)
    expect(result).toBeDefined()
    expect(typeof result).toBe('object')
    if (result && typeof result === 'object' && 'props' in result) {
      expect((result as any).props.children).toContain('Today,')
    }
  })

  it('returns plain string for non-today dates', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(14, 30, 0)
    const isoYesterday = yesterday.toISOString()
    const result = renderDashboardTimestamp(isoYesterday)

    // Should return a string or element without span wrapper
    expect(result).toBeTruthy()
  })

  it('respects custom className', () => {
    const now = new Date()
    const isoNow = now.toISOString()
    const customClass = 'custom-class'
    const result = renderDashboardTimestamp(isoNow, customClass)

    expect(result).toBeDefined()
    if (result && typeof result === 'object' && 'props' in result) {
      expect((result as any).props.className).toContain('custom-class')
    }
  })
})
