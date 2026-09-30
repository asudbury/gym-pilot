import { describe, expect, it } from 'vitest'
import type { UserSession } from '@gym-pilot/shared'
import { getSessionEntryRating, getSessionEntryTitle } from './sessionHistoryViewModel'

function makeSession(overrides: Partial<UserSession> = {}): UserSession {
  return {
    id: 'test-id',
    user_id: 'user-1',
    session_type: 'solo',
    created_at: null,
    updated_at: null,
    attendance_type: null,
    capacity: null,
    class_id: null,
    class_name: null,
    duration_minutes: null,
    gym_club_id: null,
    location: null,
    metadata: null,
    notes: null,
    price: null,
    rating: null,
    role: null,
    session_id: null,
    start_at: null,
    status: null,
    trainer_id: null,
    trainer_name: null,
    energy: null,
    energy_unit: null,
    ...overrides,
  }
}

describe('getSessionEntryRating', () => {
  it('returns a valid number rating 1–5', () => {
    expect(getSessionEntryRating(makeSession({ rating: 3 }))).toBe(3)
    expect(getSessionEntryRating(makeSession({ rating: 1 }))).toBe(1)
    expect(getSessionEntryRating(makeSession({ rating: 5 }))).toBe(5)
  })

  it('returns null for ratings outside 1–5', () => {
    expect(getSessionEntryRating(makeSession({ rating: 0 }))).toBeNull()
    expect(getSessionEntryRating(makeSession({ rating: 6 }))).toBeNull()
    expect(getSessionEntryRating(makeSession({ rating: -1 }))).toBeNull()
  })

  it('parses a valid string rating', () => {
    // @ts-expect-error testing runtime edge case with string value
    expect(getSessionEntryRating(makeSession({ rating: '4' }))).toBe(4)
  })

  it('returns null for an invalid string rating', () => {
    // @ts-expect-error testing runtime edge case with string value
    expect(getSessionEntryRating(makeSession({ rating: 'five' }))).toBeNull()
    // @ts-expect-error testing runtime edge case with string value
    expect(getSessionEntryRating(makeSession({ rating: '0' }))).toBeNull()
  })

  it('returns null for null rating', () => {
    expect(getSessionEntryRating(makeSession({ rating: null }))).toBeNull()
  })

  it('returns null for non-finite values like Infinity', () => {
    expect(getSessionEntryRating(makeSession({ rating: Infinity }))).toBeNull()
  })
})

describe('getSessionEntryTitle', () => {
  it('returns "PT Session" for personal_training', () => {
    expect(
      getSessionEntryTitle(makeSession({ session_type: 'personal_training' })),
    ).toBe('PT Session')
  })

  it('returns "Class" for class session without class_name', () => {
    expect(
      getSessionEntryTitle(makeSession({ session_type: 'class' })),
    ).toBe('Class')
  })

  it('returns class session title with class_name', () => {
    expect(
      getSessionEntryTitle(makeSession({ session_type: 'class', class_name: 'Yoga' })),
    ).toBe('Class Session: Yoga')
  })

  it('returns "Solo Session" for solo session without class_name', () => {
    expect(
      getSessionEntryTitle(makeSession({ session_type: 'solo' })),
    ).toBe('Solo Session')
  })

  it('returns solo title with class_name', () => {
    expect(
      getSessionEntryTitle(makeSession({ session_type: 'solo', class_name: 'Morning run' })),
    ).toBe('Solo Session: Morning run')
  })

  it('returns "PT Session" for unknown type with taught attendance', () => {
    expect(
      getSessionEntryTitle(makeSession({ session_type: null as never, attendance_type: 'taught' })),
    ).toBe('PT Session')
  })

  it('returns "Solo Session" for unknown type with no attendance_type', () => {
    expect(
      getSessionEntryTitle(makeSession({ session_type: null as never })),
    ).toBe('Solo Session')
  })
})
