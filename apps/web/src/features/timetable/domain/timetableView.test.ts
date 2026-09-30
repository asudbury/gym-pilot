import { describe, expect, it } from 'vitest'
import {
  formatTimetableAvailability,
  formatTimetableDateLabel,
  formatTimetableTimeLabel,
  isPastTimetableSession,
  resolveAttendanceRoleLabel,
  resolveNextActiveDayKey,
  resolveTimetableAttendanceAction,
  resolveTimetableClubSelectionViewModel,
  resolveTimetableErrorMessage,
  resolveTimetableHeaderViewModel,
  resolveTimetableViewModel,
  type TimetableSession,
} from './timetableView'

describe('resolveTimetableClubSelectionViewModel', () => {
  it('hides picker for non-virgin brands', () => {
    const result = resolveTimetableClubSelectionViewModel({
      gymBrand: 'Other',
      gymName: '123',
    })
    expect(result.showPicker).toBe(false)
  })

  it('shows picker for virgin brand', () => {
    const result = resolveTimetableClubSelectionViewModel({
      gymBrand: 'Virgin',
      gymName: '123',
    })
    expect(result.showPicker).toBe(true)
  })

  it('hides picker when gymBrand is null', () => {
    const result = resolveTimetableClubSelectionViewModel({ gymBrand: null })
    expect(result.showPicker).toBe(false)
  })

  it('is case-insensitive for virgin brand check', () => {
    const result = resolveTimetableClubSelectionViewModel({
      gymBrand: 'VIRGIN',
    })
    expect(result.showPicker).toBe(true)
  })
})

describe('resolveAttendanceRoleLabel', () => {
  it('returns "Taught" for taught type', () => {
    expect(resolveAttendanceRoleLabel('taught')).toBe('Taught')
  })

  it('returns "Attended" for attended type', () => {
    expect(resolveAttendanceRoleLabel('attended')).toBe('Attended')
  })

  it('returns "Attended" for null/undefined', () => {
    expect(resolveAttendanceRoleLabel(null)).toBe('Attended')
    expect(resolveAttendanceRoleLabel(undefined)).toBe('Attended')
  })
})

describe('resolveTimetableErrorMessage', () => {
  it('returns default message when no status or details', () => {
    const result = resolveTimetableErrorMessage({})
    expect(result).toContain('could not load the timetable')
    expect(result).toContain('The timetable service could not be reached.')
  })

  it('includes HTTP status and statusText', () => {
    const result = resolveTimetableErrorMessage({
      status: 503,
      statusText: 'Service Unavailable',
    })
    expect(result).toContain('HTTP 503 Service Unavailable')
  })

  it('includes HTTP status without statusText', () => {
    const result = resolveTimetableErrorMessage({ status: 404 })
    expect(result).toContain('HTTP 404')
    expect(result).not.toContain('undefined')
  })

  it('uses details when provided', () => {
    const result = resolveTimetableErrorMessage({ details: 'Club not found' })
    expect(result).toContain('Club not found.')
  })
})

describe('resolveTimetableAttendanceAction', () => {
  it('returns canShow false when no role', () => {
    const result = resolveTimetableAttendanceAction(undefined, undefined)
    expect(result.canShow).toBe(false)
    expect(result.options).toHaveLength(0)
  })

  it('returns attended option for client role', () => {
    const result = resolveTimetableAttendanceAction('client', [])
    expect(result.canShow).toBe(true)
    expect(result.kind).toBe('attended')
    expect(result.options).toHaveLength(1)
    expect(result.options[0]?.kind).toBe('attended')
  })

  it('returns taught option for trainer role', () => {
    const result = resolveTimetableAttendanceAction('trainer', [])
    expect(result.canShow).toBe(true)
    expect(result.kind).toBe('taught')
    expect(result.options).toHaveLength(1)
    expect(result.options[0]?.kind).toBe('taught')
  })

  it('returns both options for client+trainer roles', () => {
    const result = resolveTimetableAttendanceAction('client', ['trainer'])
    expect(result.canShow).toBe(true)
    expect(result.kind).toBe(null)
    expect(result.options).toHaveLength(2)
  })

  it('handles trainer in roles array', () => {
    const result = resolveTimetableAttendanceAction(null, ['trainer'])
    expect(result.canShow).toBe(true)
    expect(result.kind).toBe('taught')
  })
})

describe('resolveTimetableHeaderViewModel', () => {
  it('shows "Gym not selected" when no gym details', () => {
    const result = resolveTimetableHeaderViewModel({})
    expect(result.subtitle).toBe('Gym not selected')
    expect(result.showIcon).toBe(false)
    expect(result.description).toBeTruthy()
  })

  it('builds subtitle from brand and name', () => {
    const result = resolveTimetableHeaderViewModel({
      gymBrand: 'Virgin',
      gymName: 'MyGym',
    })
    expect(result.subtitle).toContain('Virgin')
    expect(result.subtitle).toContain('MyGym')
    expect(result.showIcon).toBe(true)
  })

  it('resolves virgin numeric club name using resolvedClubName', () => {
    const result = resolveTimetableHeaderViewModel({
      gymBrand: 'Virgin',
      gymName: '12345',
      resolvedClubName: 'Virgin Active Canary Wharf',
    })
    expect(result.subtitle).toContain('Virgin Active Canary Wharf')
  })

  it('falls back to raw gym name when resolvedClubName is empty', () => {
    const result = resolveTimetableHeaderViewModel({
      gymBrand: 'Virgin',
      gymName: '12345',
      resolvedClubName: '',
    })
    expect(result.subtitle).toContain('12345')
  })
})

describe('resolveNextActiveDayKey', () => {
  const groups = [{ dateKey: '2024-01-15' }, { dateKey: '2024-01-16' }]

  it('preserves "all" day key unchanged', () => {
    expect(resolveNextActiveDayKey('all', groups)).toBe('all')
  })

  it('preserves an existing valid day key', () => {
    expect(resolveNextActiveDayKey('2024-01-15', groups)).toBe('2024-01-15')
  })

  it('falls back to first group when current key is not in groups', () => {
    expect(resolveNextActiveDayKey('2024-01-20', groups)).toBe('2024-01-15')
  })

  it('returns empty string when groups are empty and key does not match', () => {
    expect(resolveNextActiveDayKey('2024-01-15', [])).toBe('')
  })

  it('preserves empty key by falling back to first group', () => {
    expect(resolveNextActiveDayKey('', groups)).toBe('2024-01-15')
  })
})

describe('resolveTimetableViewModel', () => {
  const makeSession = (
    startTime: string,
    className = 'Yoga',
    instructorName = 'Alice',
  ): TimetableSession => ({
    id: startTime,
    startTime,
    className,
    instructorName,
    capacity: 20,
    booked: 10,
  })

  it('groups sessions by date', () => {
    const sessions = [
      makeSession('2024-01-15T09:00:00Z', 'Yoga'),
      makeSession('2024-01-15T11:00:00Z', 'Pilates'),
      makeSession('2024-01-16T10:00:00Z', 'Spin'),
    ]

    const result = resolveTimetableViewModel({
      sessions,
      activeDayKey: 'all',
      activeInstructor: 'all',
      activeClassName: 'all',
    })

    expect(result.groupedSessions).toHaveLength(2)
    expect(result.groupedSessions[0]?.dateKey).toBe('2024-01-15')
    expect(result.groupedSessions[1]?.dateKey).toBe('2024-01-16')
  })

  it('returns all sessions when activeDayKey is "all"', () => {
    const sessions = [
      makeSession('2024-01-15T09:00:00Z'),
      makeSession('2024-01-16T09:00:00Z'),
    ]

    const result = resolveTimetableViewModel({
      sessions,
      activeDayKey: 'all',
      activeInstructor: 'all',
      activeClassName: 'all',
    })

    expect(result.visibleSessions).toHaveLength(2)
  })

  it('filters by active day key', () => {
    const sessions = [
      makeSession('2024-01-15T09:00:00Z'),
      makeSession('2024-01-16T09:00:00Z'),
    ]

    const result = resolveTimetableViewModel({
      sessions,
      activeDayKey: '2024-01-15',
      activeInstructor: 'all',
      activeClassName: 'all',
    })

    expect(result.visibleSessions).toHaveLength(1)
    expect(result.visibleSessions[0]?.startTime).toContain('2024-01-15')
  })

  it('filters by instructor name', () => {
    const sessions = [
      makeSession('2024-01-15T09:00:00Z', 'Yoga', 'Alice'),
      makeSession('2024-01-15T10:00:00Z', 'Spin', 'Bob'),
    ]

    const result = resolveTimetableViewModel({
      sessions,
      activeDayKey: 'all',
      activeInstructor: 'Alice',
      activeClassName: 'all',
    })

    expect(result.visibleSessions).toHaveLength(1)
    expect(result.visibleSessions[0]?.instructorName).toBe('Alice')
  })

  it('filters by class name', () => {
    const sessions = [
      makeSession('2024-01-15T09:00:00Z', 'Yoga'),
      makeSession('2024-01-15T10:00:00Z', 'Spin'),
    ]

    const result = resolveTimetableViewModel({
      sessions,
      activeDayKey: 'all',
      activeInstructor: 'all',
      activeClassName: 'Spin',
    })

    expect(result.visibleSessions).toHaveLength(1)
    expect(result.visibleSessions[0]?.className).toBe('Spin')
  })

  it('builds instructor options from sessions with class names', () => {
    const sessions = [
      makeSession('2024-01-15T09:00:00Z', 'Yoga', 'Alice'),
      makeSession('2024-01-15T10:00:00Z', 'Spin', 'Bob'),
      makeSession('2024-01-15T11:00:00Z', 'Yoga', 'Alice'),
    ]

    const result = resolveTimetableViewModel({
      sessions,
      activeDayKey: 'all',
      activeInstructor: 'all',
      activeClassName: 'all',
    })

    expect(result.instructorOptions).toEqual(['Alice', 'Bob'])
  })

  it('builds deduplicated class options', () => {
    const sessions = [
      makeSession('2024-01-15T09:00:00Z', 'Yoga'),
      makeSession('2024-01-15T10:00:00Z', 'Yoga'),
      makeSession('2024-01-15T11:00:00Z', 'Spin'),
    ]

    const result = resolveTimetableViewModel({
      sessions,
      activeDayKey: 'all',
      activeInstructor: 'all',
      activeClassName: 'all',
    })

    expect(result.classOptions).toEqual(['Spin', 'Yoga'])
  })

  it('handles empty sessions array', () => {
    const result = resolveTimetableViewModel({
      sessions: [],
      activeDayKey: 'all',
      activeInstructor: 'all',
      activeClassName: 'all',
    })

    expect(result.groupedSessions).toHaveLength(0)
    expect(result.visibleSessions).toHaveLength(0)
    expect(result.instructorOptions).toHaveLength(0)
    expect(result.classOptions).toHaveLength(0)
  })
})

describe('formatTimetableDateLabel', () => {
  it('returns "Unknown date" for null/undefined/empty', () => {
    expect(formatTimetableDateLabel(null)).toBe('Unknown date')
    expect(formatTimetableDateLabel(undefined)).toBe('Unknown date')
    expect(formatTimetableDateLabel('')).toBe('Unknown date')
  })

  it('returns "Unknown date" for invalid date strings', () => {
    expect(formatTimetableDateLabel('not-a-date')).toBe('Unknown date')
  })

  it('formats a valid date string', () => {
    const result = formatTimetableDateLabel('2024-01-15T10:00:00Z')
    expect(result).toBeTruthy()
    expect(result).not.toBe('Unknown date')
  })
})

describe('formatTimetableTimeLabel', () => {
  it('returns "Time TBD" for null/undefined/empty', () => {
    expect(formatTimetableTimeLabel(null)).toBe('Time TBD')
    expect(formatTimetableTimeLabel(undefined)).toBe('Time TBD')
    expect(formatTimetableTimeLabel('')).toBe('Time TBD')
  })

  it('returns raw value for invalid date strings', () => {
    expect(formatTimetableTimeLabel('not-a-date')).toBe('not-a-date')
  })

  it('formats a valid ISO date string', () => {
    const result = formatTimetableTimeLabel('2024-01-15T10:00:00Z')
    expect(result).toBeTruthy()
    expect(result).not.toBe('Time TBD')
  })
})

describe('formatTimetableAvailability', () => {
  it('returns availability string when booked and capacity are numbers', () => {
    const session: TimetableSession = { booked: 10, capacity: 20 }
    expect(formatTimetableAvailability(session)).toBe('10/20 booked')
  })

  it('returns unavailable message when either is missing', () => {
    expect(formatTimetableAvailability({ booked: 5 })).toBe(
      'Availability unavailable',
    )
    expect(formatTimetableAvailability({ capacity: 20 })).toBe(
      'Availability unavailable',
    )
    expect(formatTimetableAvailability({})).toBe('Availability unavailable')
  })
})

describe('isPastTimetableSession', () => {
  it('returns false when startTime is missing', () => {
    expect(isPastTimetableSession({})).toBe(false)
    expect(isPastTimetableSession({ startTime: null })).toBe(false)
  })

  it('returns false for invalid date', () => {
    expect(isPastTimetableSession({ startTime: 'not-a-date' })).toBe(false)
  })

  it('returns true for a past date', () => {
    expect(isPastTimetableSession({ startTime: '2000-01-01T00:00:00Z' })).toBe(
      true,
    )
  })

  it('returns false for a future date', () => {
    expect(isPastTimetableSession({ startTime: '2099-01-01T00:00:00Z' })).toBe(
      false,
    )
  })
})
