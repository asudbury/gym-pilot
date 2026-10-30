import { describe, expect, it, vi } from 'vitest'
import {
  readTimetableAttendanceState,
  writeTimetableAttendanceState,
} from './timetableAttendanceStorage'

describe('timetableAttendanceStorage', () => {
  it('returns parsed attendance values when storage payload is valid', () => {
    const storage = {
      getItem: vi.fn().mockReturnValue(
        JSON.stringify({
          'session-1': 'attended',
          'session-2': 'taught',
        }),
      ),
    }

    expect(
      readTimetableAttendanceState(storage, 'gym-pilot.timetable-attendance'),
    ).toEqual({
      'session-1': 'attended',
      'session-2': 'taught',
    })
  })

  it('drops invalid attendance entries', () => {
    const storage = {
      getItem: vi.fn().mockReturnValue(
        JSON.stringify({
          'session-1': 'attended',
          'session-2': 'invalid',
          'session-3': null,
        }),
      ),
    }

    expect(
      readTimetableAttendanceState(storage, 'gym-pilot.timetable-attendance'),
    ).toEqual({
      'session-1': 'attended',
    })
  })

  it('returns an empty object when payload is malformed', () => {
    const storage = {
      getItem: vi.fn().mockReturnValue('{not-json'),
    }

    expect(
      readTimetableAttendanceState(storage, 'gym-pilot.timetable-attendance'),
    ).toEqual({})
  })

  it('writes attendance state to storage as JSON', () => {
    const storage = {
      setItem: vi.fn(),
    }

    writeTimetableAttendanceState(storage, 'gym-pilot.timetable-attendance', {
      'session-1': 'attended',
    })

    expect(storage.setItem).toHaveBeenCalledWith(
      'gym-pilot.timetable-attendance',
      JSON.stringify({ 'session-1': 'attended' }),
    )
  })
})
