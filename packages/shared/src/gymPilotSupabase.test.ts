import { describe, expect, it, vi } from 'vitest'
import {
  buildSessionBookingAttendancePayload,
  buildSessionRecordPayload,
  buildSupabaseProfileLocalCacheEntry,
  buildWorkoutItemsPersistencePayloads,
  buildSupabaseUserActivityEventData,
  buildSupabaseUserRoleRows,
  buildSessionHistoryDeleteError,
  formatSessionHistoryError,
  getSessionHistorySelectColumns,
  getSessionHistoryTableName,
  getSupabaseProfileLocalStorageKey,
  getSupabaseTableName,
  getSessionBookingTableName,
  getWorkoutItemsTableName,
  getSessionTableName,
  isLocalhostHost,
  listSessions,
  mapSessionHistoryEntryFromSupabase,
  normalizeSessionTypeForPersistence,
  normalizeSupabaseUserRoleRows,
  recordSession,
  removeSessionHistoryEntry,
  shouldRecordLoginActivity,
  shouldRecordSupabaseUserActivity,
  upsertSessionHistoryEntry,
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

describe('session history helpers', () => {
  it('builds a delete error that the UI can show to the user', () => {
    const error = buildSessionHistoryDeleteError('entry-1')

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain('delete')
  })

  it('replaces an existing attendance record when the same id is upserted', () => {
    const records = [
      {
        id: 'entry-1',
        attendanceType: 'attended',
        className: 'Yoga',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    const updated = upsertSessionHistoryEntry(records, {
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

    const updated = removeSessionHistoryEntry(records, 'entry-1')

    expect(updated).toHaveLength(1)
    expect(updated[0].id).toBe('entry-2')
  })

  it('deduplicates entries that refer to the same session identity', () => {
    const records = [
      {
        id: 'entry-1',
        sessionId: 'session-1',
        attendanceType: 'attended',
        className: 'Yoga',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    const updated = upsertSessionHistoryEntry(records, {
      id: 'entry-2',
      sessionId: 'session-1',
      attendanceType: 'taught',
      className: 'Yoga',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    } as any)

    expect(updated).toHaveLength(1)
    expect(updated[0].id).toBe('entry-2')
  })

  it('deduplicates solo sessions that share the same user and start time', () => {
    const records = [
      {
        id: 'entry-1',
        userId: 'user-1',
        sessionType: 'solo',
        startedAt: '2026-01-01T10:00:00.000Z',
        attendanceType: 'attended',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    const updated = upsertSessionHistoryEntry(records, {
      id: 'entry-2',
      userId: 'user-1',
      sessionType: 'solo',
      startedAt: '2026-01-01T10:00:00.000Z',
      attendanceType: 'attended',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    } as any)

    expect(updated).toHaveLength(1)
    expect(updated[0].id).toBe('entry-2')
  })
})

describe('remote session mapping', () => {
  it('maps Supabase attendance rows into the UI history entry shape', () => {
    const entry = mapSessionHistoryEntryFromSupabase({
      id: 'entry-1',
      user_id: 'user-1',
      session_id: 'session-1',
      class_id: 'class-7',
      class_name: 'Yoga Flow',
      trainer_name: 'Sam',
      start_at: '2026-01-01T10:00:00.000Z',
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

  it('preserves the persisted session type for history entries', () => {
    const entry = mapSessionHistoryEntryFromSupabase({
      id: 'entry-3',
      user_id: 'user-1',
      session_type: 'personal_training',
      trainer_name: 'Sam',
      start_at: '2026-01-01T10:00:00.000Z',
      attendance_type: 'attended',
      created_at: '2026-01-01T09:30:00.000Z',
    } as any)

    expect(entry.sessionType).toBe('personal_training')
  })

  it('persists a solo session name in the session payload', () => {
    const payload = buildSessionRecordPayload({
      userId: 'user-1',
      sessionType: 'solo',
      className: 'Morning mobility',
      startAt: '2026-01-01T10:00:00.000Z',
    })

    expect(payload.class_name).toBe('Morning mobility')
  })

  it('maps rows that use the database trainer_name column', () => {
    const entry = mapSessionHistoryEntryFromSupabase({
      id: 'entry-2',
      user_id: 'user-1',
      class_name: 'Pilates',
      trainer_name: 'Alex',
      started_at: '2026-01-02T10:00:00.000Z',
      attendance_type: 'taught',
      notes: 'Led the session',
      rating: 4,
      created_at: '2026-01-02T09:30:00.000Z',
    } as any)

    expect(entry.instructorName).toBe('Alex')
    expect(entry.attendanceType).toBe('taught')
  })

  it('normalizes numeric-string ratings from persistence rows', () => {
    const entry = mapSessionHistoryEntryFromSupabase({
      id: 'entry-4',
      user_id: 'user-1',
      session_type: 'solo',
      start_at: '2026-01-03T10:00:00.000Z',
      attendance_type: 'attended',
      rating: '5',
      created_at: '2026-01-03T09:30:00.000Z',
    } as any)

    expect(entry.rating).toBe(5)
  })

  it('maps persisted duration minutes into history entries', () => {
    const entry = mapSessionHistoryEntryFromSupabase({
      id: 'entry-5',
      user_id: 'user-1',
      session_type: 'solo',
      start_at: '2026-01-04T10:00:00.000Z',
      attendance_type: 'attended',
      duration_minutes: 45,
      created_at: '2026-01-04T09:30:00.000Z',
    } as any)

    expect(entry.durationMinutes).toBe(45)
  })
})

describe('session history table selection', () => {
  it('uses the consolidated user session table for history persistence', () => {
    expect(getSessionHistoryTableName()).toBe('gym_pilot_user_session')
  })

  it('includes the related session data needed to recover class and instructor names', () => {
    const selectColumns = getSessionHistorySelectColumns()

    expect(selectColumns).toContain('class_name')
    expect(selectColumns).toContain('trainer_name')
    expect(selectColumns).toContain('session:session_id')
  })
})

describe('session-based shared helpers', () => {
  it('exposes session-oriented helpers for listing and recording sessions', () => {
    expect(typeof listSessions).toBe('function')
    expect(typeof recordSession).toBe('function')
  })

  it('returns a failure when workout persistence fails', async () => {
    const mockClient = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn().mockResolvedValue({ data: [{ id: 'session-1' }], error: null }),
          })),
        })),
        delete: vi.fn(() => ({ eq: vi.fn(() => ({}) ) })),
      })),
    }

    vi.doMock('./gymPilotSupabase', async () => {
      const actual = await vi.importActual<typeof import('./gymPilotSupabase')>('./gymPilotSupabase')
      return {
        ...actual,
        getSupabaseClient: () => mockClient,
        getAuthenticatedUserId: vi.fn().mockResolvedValue('user-1'),
      }
    })

    const module = await import('./gymPilotSupabase')
    const result = await module.recordSession({
      sessionId: 'session-1',
      role: 'client',
      workoutItems: [{ id: 'item-1', category: 'exercise', exerciseName: 'Squat' } as any],
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(Error)
  })
})

describe('session table naming', () => {
  it('uses the consolidated user session table for session persistence', () => {
    expect(getSessionTableName()).toBe('gym_pilot_user_session')
    expect(getSessionBookingTableName()).toBe('gym_pilot_user_session')
  })

  it('uses the locally available workout items table for workout persistence', () => {
    expect(getWorkoutItemsTableName()).toBe('gym_pilot_user_session_workout_item')
  })
})

describe('workout item persistence payloads', () => {
  it('builds rows that can be upserted for a session and user', () => {
    const payloads = buildWorkoutItemsPersistencePayloads({
      sessionId: 'session-1',
      userId: 'user-1',
      workoutItems: [
        {
          id: 'item-1',
          category: 'exercise',
          exerciseName: 'Squat',
          exerciseId: 'exercise-1',
          reps: '3',
          sets: '10',
          sortOrder: 0,
        },
      ],
    })

    expect(payloads).toHaveLength(1)
    expect(payloads[0]).toMatchObject({
      id: 'item-1',
      session_id: 'session-1',
      user_id: 'user-1',
      item_index: 0,
      category: 'exercise',
      exercise_name: 'Squat',
      exercise_id: 'exercise-1',
      reps: '3',
      sets: '10',
      sort_order: 0,
    })
  })
})

describe('session type normalization', () => {
  it('defaults missing session types to a valid persisted value', () => {
    expect(normalizeSessionTypeForPersistence(undefined as never)).toBe('solo')
    expect(normalizeSessionTypeForPersistence('personal_training')).toBe('personal_training')
    expect(normalizeSessionTypeForPersistence('solo')).toBe('solo')
  })
})

it('maps booking roles into attendance history entries', () => {
  const entry = mapSessionHistoryEntryFromSupabase({
    id: 'entry-1',
    user_id: 'user-1',
    session_id: 'session-1',
    role: 'trainer',
    status: 'attended',
    notes: 'Led the session',
    rating: 4,
    created_at: '2026-01-01T10:00:00.000Z',
    session: {
      class_name: 'Pilates',
      trainer_name: 'Sam',
      start_at: '2026-01-01T10:00:00.000Z',
    },
  } as any)

  expect(entry.attendanceType).toBe('taught')
  expect(entry.className).toBe('Pilates')
  expect(entry.instructorName).toBe('Sam')
})

it('includes a persisted session type for timetable booking payloads', () => {
  const payload = buildSessionBookingAttendancePayload({
    userId: 'user-1',
    sessionId: 'session-1',
    classId: 'class-7',
    className: 'Yoga Flow',
    instructorName: 'Sam',
    startedAt: '2026-01-01T10:00:00.000Z',
    attendanceType: 'attended',
    notes: 'Great class',
    rating: 5,
    durationMinutes: 45,
  })

  expect(payload).toMatchObject({
    user_id: 'user-1',
    session_id: 'session-1',
    class_id: 'class-7',
    class_name: 'Yoga Flow',
    trainer_name: 'Sam',
    role: 'client',
    status: 'attended',
    attendance_type: 'attended',
  })
  expect(payload).toHaveProperty('session_type', 'class')
  expect(payload).toHaveProperty('duration_minutes', 45)
})

it('builds booking payloads using only supported columns', () => {
  const payload = buildSessionBookingAttendancePayload({
    userId: 'user-1',
    sessionId: 'session-1',
    attendanceType: 'taught',
    notes: 'Led the session',
    rating: 4,
  })

  expect(payload).toMatchObject({
    user_id: 'user-1',
    session_id: 'session-1',
    role: 'trainer',
    status: 'attended',
    notes: 'Led the session',
    rating: 4,
  })
  expect(payload).toHaveProperty('class_id', null)
  expect(payload).toHaveProperty('attendance_type', 'taught')
  expect(payload).toHaveProperty('session_type', 'solo')
})

it('builds a session record payload that persists the authenticated user id', () => {
  const payload = buildSessionRecordPayload({
    userId: 'user-1',
    sessionType: 'solo',
    startAt: '2026-01-01T10:00:00.000Z',
  })

  expect(payload).toMatchObject({
    user_id: 'user-1',
    session_type: 'solo',
    status: 'attended',
    start_at: '2026-01-01T10:00:00.000Z',
  })
})

describe('session history error formatting', () => {
  it('returns a readable message for Supabase table errors', () => {
    expect(formatSessionHistoryError({ message: "Could not find the table 'public.class_attendance' in the schema cache" })).toBe("Could not find the table 'public.class_attendance' in the schema cache")
  })

  it('falls back to a generic message for unknown errors', () => {
    expect(formatSessionHistoryError('something went wrong')).toBe('We could not load your session history right now.')
  })
})

describe('user role table helpers', () => {
  it('builds role rows for the dedicated user roles table', () => {
    expect(buildSupabaseUserRoleRows('user-1', ['admin', 'client'])).toEqual([
      { user_id: 'user-1', role: 'admin' },
      { user_id: 'user-1', role: 'client' },
    ])
  })

  it('normalizes role rows into the app role model', () => {
    expect(normalizeSupabaseUserRoleRows([
      { user_id: 'user-1', role: 'admin' },
      { user_id: 'user-1', role: 'client' },
      { user_id: 'user-1', role: 'invalid' },
    ])).toEqual(['admin', 'client'])
  })
})

describe('local profile snapshot sync', () => {
  it('builds a stable IndexedDB cache entry for the current profile snapshot', () => {
    const entry = buildSupabaseProfileLocalCacheEntry('user-1', {
      friendlyName: 'Ada',
      applicationName: 'Gym Pilot',
      gymBrand: 'Virgin',
      gymName: 'Manchester',
      gymClubId: '123',
      accountTier: 'gold',
      accessEndsAt: null,
      isFrozen: false,
      lastLoggedInAt: '2026-01-01T00:00:00.000Z',
      previousLastLoggedInAt: null,
      mustChangePassword: false,
      termsAccepted: true,
      termsAcceptedAt: '2026-01-01T00:00:00.000Z',
      roles: ['admin'],
      trainerId: null,
    })

    expect(getSupabaseProfileLocalStorageKey('user-1')).toBe('profile:user-1')
    expect(entry.userId).toBe('user-1')
    expect(entry.snapshot.friendlyName).toBe('Ada')
    expect(entry.snapshot.roles).toEqual(['admin'])
    expect(entry.storedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('local activity recording guard', () => {
  it('treats localhost-style hosts as local but still allows activity recording', async () => {
    expect(isLocalhostHost('localhost')).toBe(true)
    expect(isLocalhostHost('127.0.0.1')).toBe(true)
    expect(isLocalhostHost('::1')).toBe(true)
    expect(isLocalhostHost('foo.localhost')).toBe(true)
    await expect(shouldRecordSupabaseUserActivity()).resolves.toBe(true)
  })

  it('allows recording when the host is not localhost', async () => {
    expect(isLocalhostHost('gym-pilot.example.com')).toBe(false)
    await expect(shouldRecordSupabaseUserActivity()).resolves.toBe(true)
  })

  it('keeps activity event data privacy-safe while adding a friendly name', () => {
    expect(buildSupabaseUserActivityEventData({ email: 'ada@example.com' }, 'Ada')).toEqual({
      friendlyName: 'Ada',
    })
  })

  it('preserves an email when no friendly name is available', () => {
    expect(buildSupabaseUserActivityEventData({ email: 'ada@example.com' }, null)).toEqual({
      email: 'ada@example.com',
    })
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
