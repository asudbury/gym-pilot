import { describe, expect, it } from 'vitest'
import type { SessionHistoryEntry } from '@gym-pilot/shared'
import {
  getSessionEntryRating,
  getSessionEntryTitle,
} from './sessionHistoryViewModel'

describe('session history view model', () => {
  it('builds a readable title for class sessions', () => {
    const entry = {
      id: 'entry-1',
      sessionType: 'class' as const,
      className: 'Yoga Flow',
      attendanceType: 'attended' as const,
    } satisfies SessionHistoryEntry

    expect(getSessionEntryTitle(entry)).toBe('Class: Yoga Flow')
  })

  it('falls back to a generic title for solo sessions', () => {
    const entry = {
      id: 'entry-2',
      sessionType: 'solo' as const,
      attendanceType: 'attended' as const,
    } satisfies SessionHistoryEntry

    expect(getSessionEntryTitle(entry)).toBe('Solo Session')
  })

  it('normalizes string ratings so they still render in the history UI', () => {
    const entry = {
      id: 'entry-3',
      sessionType: 'solo' as const,
      attendanceType: 'attended' as const,
      rating: '5' as unknown as number,
    } satisfies SessionHistoryEntry

    expect(getSessionEntryRating(entry)).toBe(5)
  })
})
