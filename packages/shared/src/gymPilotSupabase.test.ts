import { describe, expect, it } from 'vitest'
import {
  formatAttendanceHistoryError,
  getAttendanceHistoryTableName,
  getSupabaseTableName,
  isLocalhostHost,
  mapAttendanceHistoryEntryFromSupabase,
  removeAttendanceHistoryEntry,
  shouldRecordLoginActivity,
  shouldRecordSupabaseUserActivity,
  upsertAttendanceHistoryEntry,
} from './gymPilotSupabase'

describe('timetable attendance persistence', () => {
  it('includes the rating in the attendance payload when provided', () => {
    const payload = {
      user_id: 'user-1',
      session_id: 'session-1',
      attendance_type: 'attended',
      notes: 'Great class',
      rating: 5,
      created_at: '2026-01-01T00:00:00.000Z',
    }

    expect(payload.rating).toBe(5)
  })
})

describe('attendance history helpers', () => {
  it('replaces an existing attendance record when the same id is upserted', () => {
    const records = [
      {
        id: 'entry-1',
        attendanceType: 'attended',
        className: 'Yoga',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    const updated = upsertAttendanceHistoryEntry(records, {
      id: 'entry-1',
      attendanceType: 'taught',
      className: 'Yoga',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    })

    expect(updated).toHaveLength(1)
    expect(updated[0].attendanceType).toBe('taught')
    expect(updated[0].updatedAt).toBe('2026-01-02T00:00:00.000Z')
  })

  it('removes the matching attendance record by id', () => {
    const records = [
      {
        id: 'entry-1',
        attendanceType: 'attended',
        className: 'Yoga',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'entry-2',
        attendanceType: 'taught',
        className: 'Pilates',
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ]

    const updated = removeAttendanceHistoryEntry(records, 'entry-1')

    expect(updated).toHaveLength(1)
    expect(updated[0].id).toBe('entry-2')
  })
})

describe('remote attendance mapping', () => {
  it('maps Supabase attendance rows into the UI history entry shape', () => {
    const entry = mapAttendanceHistoryEntryFromSupabase({
      id: 'entry-1',
      user_id: 'user-1',
      session_id: 'session-1',
      class_id: 'class-7',
      class_name: 'Yoga Flow',
      instructor_name: 'Sam',
      started_at: '2026-01-01T10:00:00.000Z',
      attendance_type: 'attended',
      notes: 'Great class',
      rating: 5,
      created_at: '2026-01-01T09:30:00.000Z',
    })

    expect(entry).toMatchObject({
      id: 'entry-1',
      userId: 'user-1',
      sessionId: 'session-1',
      classId: 'class-7',
      className: 'Yoga Flow',
      instructorName: 'Sam',
      startedAt: '2026-01-01T10:00:00.000Z',
      attendanceType: 'attended',
      notes: 'Great class',
      rating: 5,
      createdAt: '2026-01-01T09:30:00.000Z',
    })
  })
})

describe('attendance history table selection', () => {
  it('prefers the shared Supabase attendance table name', () => {
    expect(getAttendanceHistoryTableName()).toBe('gym_pilot_class_attendance')
  })
})

describe('attendance history error formatting', () => {
  it('returns a readable message for Supabase table errors', () => {
    expect(formatAttendanceHistoryError({ message: "Could not find the table 'public.class_attendance' in the schema cache" })).toBe("Could not find the table 'public.class_attendance' in the schema cache")
  })

  it('falls back to a generic message for unknown errors', () => {
    expect(formatAttendanceHistoryError('something went wrong')).toBe('We could not load your attendance history right now.')
  })
})

describe('local activity recording guard', () => {
  it('treats localhost-style hosts as local and skips recording', () => {
    expect(isLocalhostHost('localhost')).toBe(true)
    expect(isLocalhostHost('127.0.0.1')).toBe(true)
    expect(isLocalhostHost('::1')).toBe(true)
    expect(isLocalhostHost('foo.localhost')).toBe(true)
  })

  it('allows recording when the host is not localhost', () => {
    expect(isLocalhostHost('gym-pilot.example.com')).toBe(false)
    expect(shouldRecordSupabaseUserActivity()).toBe(true)
  })

  it('maps app storage keys to the singular table naming convention', () => {
    expect(getSupabaseTableName('gym-pilot-plans')).toBe('gym_pilot_plan')
    expect(getSupabaseTableName('gym-pilot-assignments')).toBe('gym_pilot_assignment')
    expect(getSupabaseTableName('gym-pilot.favorites')).toBe('gym_pilot_favourite')
  })

  it('only records a login activity when the profile timestamp actually changes', () => {
    expect(shouldRecordLoginActivity('2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z')).toBe(false)
    expect(shouldRecordLoginActivity('2025-01-02T00:00:00.000Z', '2025-01-01T00:00:00.000Z')).toBe(true)
  })
})
