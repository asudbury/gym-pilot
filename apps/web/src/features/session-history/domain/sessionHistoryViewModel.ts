import type { SessionHistoryEntry } from '@gym-pilot/shared'

export function getSessionEntryRating(
  entry: SessionHistoryEntry,
): number | null {
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

export function getSessionEntryTitle(entry: SessionHistoryEntry) {
  if (entry.className?.trim()) {
    if (entry.sessionType === 'class') {
      return `Class Session: ${entry.className}`
    }

    return entry.className
  }

  if (entry.sessionType === 'personal_training') {
    return 'PT Session'
  }

  if (entry.sessionType === 'class') {
    return 'Class'
  }

  if (entry.sessionType === 'solo') {
    return 'Solo Session'
  }

  if (entry.attendanceType === 'taught') {
    return 'PT Session'
  }

  return 'Solo Session'
}
