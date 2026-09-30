import type { UserSession } from '@gym-pilot/shared'

/**
 * Returns a copy of the session entries sorted by `created_at` descending
 * (most recent first). Entries without a `created_at` are sorted last.
 *
 * @param entries - The session entries to sort.
 * @returns A new sorted array; the input is not mutated.
 */
export function sortSessionEntries(entries: UserSession[]): UserSession[] {
  return [...entries].sort((left, right) =>
    (right.created_at ?? '').localeCompare(left.created_at ?? ''),
  )
}

export function getSessionEntryRating(entry: UserSession): number | null {
  if (
    typeof entry.rating === 'number' &&
    Number.isFinite(entry.rating) &&
    entry.rating >= 1 &&
    entry.rating <= 5
  ) {
    return entry.rating
  }

  if (typeof entry.rating === 'string') {
    const parsed = Number(entry.rating)
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 5) {
      return parsed
    }
  }

  return null
}

export function getSessionEntryTitle(entry: UserSession) {
  if (entry.class_name?.trim()) {
    if (entry.session_type === 'class') {
      return `Class Session: ${entry.class_name}`
    }
  }

  if (entry.session_type === 'personal_training') {
    return 'PT Session'
  }

  if (entry.session_type === 'class') {
    return 'Class'
  }

  if (entry.session_type === 'solo') {
    return entry.class_name?.trim()
      ? `Solo Session: ${entry.class_name}`
      : 'Solo Session'
  }

  if (entry.attendance_type === 'taught') {
    return 'PT Session'
  }

  return 'Solo Session'
}
