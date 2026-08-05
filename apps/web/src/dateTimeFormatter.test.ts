import { describe, expect, it } from 'vitest'
import {
  formatDateForDisplay,
  formatDateTimeForDisplay,
  formatDateTimeLocalInputValue,
  formatDateTimeLocalInputValueFromValue,
  toUtcIsoStringFromLocalInputValue,
} from './dateTimeFormatter'

describe('formatDateTimeForDisplay', () => {
  it('should format a date with year and ordinal suffix correctly', () => {
    const date = new Date('2023-05-22T10:15:00') // Monday, 22nd May 2023 10:15
    expect(formatDateTimeForDisplay(date, { includeYear: true })).toBe(
      'Mon 22nd May 2023 at 10:15',
    )
  })

  it('should format a date without year and with ordinal suffix correctly', () => {
    const date = new Date('2023-05-22T10:15:00') // Monday, 22nd May 10:15
    expect(formatDateTimeForDisplay(date, { includeYear: false })).toBe(
      'Mon 22nd May at 10:15',
    )
  })

  it('should handle "st" suffix correctly', () => {
    const date = new Date('2023-01-01T10:00:00') // 1st
    expect(formatDateTimeForDisplay(date, { includeYear: false })).toBe(
      'Sun 1st Jan at 10:00',
    )
    const date21 = new Date('2023-01-21T10:00:00') // 21st
    expect(formatDateTimeForDisplay(date21, { includeYear: false })).toBe(
      'Sat 21st Jan at 10:00',
    )
    const date31 = new Date('2023-01-31T10:00:00') // 31st
    expect(formatDateTimeForDisplay(date31, { includeYear: false })).toBe(
      'Tue 31st Jan at 10:00',
    )
  })

  it('should handle "nd" suffix correctly', () => {
    const date = new Date('2023-02-02T10:00:00') // 2nd
    expect(formatDateTimeForDisplay(date, { includeYear: false })).toBe(
      'Thu 2nd Feb at 10:00',
    )
    const date22 = new Date('2023-02-22T10:00:00') // 22nd
    expect(formatDateTimeForDisplay(date22, { includeYear: false })).toBe(
      'Wed 22nd Feb at 10:00',
    )
  })

  it('should handle "rd" suffix correctly', () => {
    const date = new Date('2023-03-03T10:00:00') // 3rd
    expect(formatDateTimeForDisplay(date, { includeYear: false })).toBe(
      'Fri 3rd Mar at 10:00',
    )
    const date23 = new Date('2023-03-23T10:00:00') // 23rd
    expect(formatDateTimeForDisplay(date23, { includeYear: false })).toBe(
      'Thu 23rd Mar at 10:00',
    )
  })

  it('should handle "th" suffix correctly (default and special cases)', () => {
    const date4 = new Date('2023-04-04T10:00:00') // 4th
    expect(formatDateTimeForDisplay(date4, { includeYear: false })).toBe(
      'Tue 4th Apr at 10:00',
    )
    const date11 = new Date('2023-06-11T10:00:00') // 11th
    expect(formatDateTimeForDisplay(date11, { includeYear: false })).toBe(
      'Sun 11th Jun at 10:00',
    )
    const date12 = new Date('2023-06-12T10:00:00') // 12th
    expect(formatDateTimeForDisplay(date12, { includeYear: false })).toBe(
      'Mon 12th Jun at 10:00',
    )
    const date13 = new Date('2023-06-13T10:00:00') // 13th
    expect(formatDateTimeForDisplay(date13, { includeYear: false })).toBe(
      'Tue 13th Jun at 10:00',
    )
  })

  it('should return "Invalid Date" for an invalid date input', () => {
    expect(
      formatDateTimeForDisplay('invalid date string', { includeYear: true }),
    ).toBe('Invalid Date')
  })
})

describe('datetime input helpers', () => {
  it('formats a Date as a local datetime-local input value', () => {
    const date = new Date(2023, 4, 22, 10, 15)

    expect(formatDateTimeLocalInputValue(date)).toBe('2023-05-22T10:15')
  })

  it('converts a local datetime-local value to a UTC ISO string', () => {
    const localValue = '2023-05-22T10:15'

    expect(toUtcIsoStringFromLocalInputValue(localValue)).toBe(
      new Date(localValue).toISOString(),
    )
  })

  it('formats a UTC ISO string for display as a local datetime-local value', () => {
    const utcValue = new Date('2023-05-22T10:15:00.000Z').toISOString()

    expect(formatDateTimeLocalInputValueFromValue(utcValue)).toBe(
      formatDateTimeLocalInputValue(new Date(utcValue)),
    )
  })
})

describe('formatDateForDisplay', () => {
  it('should format a date with year and ordinal suffix correctly (default includeYear)', () => {
    const date = new Date('2023-05-22T10:15:00') // Monday, 22nd May 2023
    expect(formatDateForDisplay(date)).toBe('Mon 22nd May 2023')
  })

  it('should format a date with year and ordinal suffix correctly (explicit includeYear: true)', () => {
    const date = new Date('2023-05-22T10:15:00') // Monday, 22nd May 2023
    expect(formatDateForDisplay(date, { includeYear: true })).toBe(
      'Mon 22nd May 2023',
    )
  })

  it('should format a date without year and with ordinal suffix correctly (includeYear: false)', () => {
    const date = new Date('2023-05-22T10:15:00') // Monday, 22nd May
    expect(formatDateForDisplay(date, { includeYear: false })).toBe(
      'Mon 22nd May',
    )
  })

  it('should handle "st" suffix correctly in formatDate', () => {
    const date = new Date('2023-01-01T10:00:00') // 1st
    expect(formatDateForDisplay(date, { includeYear: false })).toBe(
      'Sun 1st Jan',
    )
    const date21 = new Date('2023-01-21T10:00:00') // 21st
    expect(formatDateForDisplay(date21, { includeYear: false })).toBe(
      'Sat 21st Jan',
    )
    const date31 = new Date('2023-01-31T10:00:00') // 31st
    expect(formatDateForDisplay(date31, { includeYear: false })).toBe(
      'Tue 31st Jan',
    )
  })

  it('should handle "nd" suffix correctly in formatDate', () => {
    const date = new Date('2023-02-02T10:00:00') // 2nd
    expect(formatDateForDisplay(date, { includeYear: false })).toBe(
      'Thu 2nd Feb',
    )
  })

  it('should handle "rd" suffix correctly in formatDate', () => {
    const date = new Date('2023-03-03T10:00:00') // 3rd
    expect(formatDateForDisplay(date, { includeYear: false })).toBe(
      'Fri 3rd Mar',
    )
  })

  it('should handle "th" suffix correctly in formatDate (default and special cases)', () => {
    const date4 = new Date('2023-04-04T10:00:00') // 4th
    expect(formatDateForDisplay(date4, { includeYear: false })).toBe(
      'Tue 4th Apr',
    )
    const date11 = new Date('2023-06-11T10:00:00') // 11th
    expect(formatDateForDisplay(date11, { includeYear: false })).toBe(
      'Sun 11th Jun',
    )
  })

  it('should return "Invalid Date" for an invalid date input in formatDate', () => {
    expect(formatDateForDisplay('invalid date string')).toBe('Invalid Date')
  })
})
