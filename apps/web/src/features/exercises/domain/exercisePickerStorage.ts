import type { Exercise } from '@gym-pilot/shared'
import { getExerciseSlug } from '../../../utils/exerciseRouteUtils'
import type { QuickLink } from '../../favourites/domain/quickLinks'

export const EXERCISE_PICKER_RECENT_KEY = 'gym-pilot.exercise-picker.recent'
export const EXERCISE_PICKER_FAVORITES_KEY =
  'gym-pilot.exercise-picker.favorites'

export function normalizeExerciseIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  )
}

export function readRecentExerciseIds(
  storage?: Pick<Storage, 'getItem' | 'removeItem'> | null,
): string[] {
  if (!storage) {
    return []
  }

  try {
    const savedValue = storage.getItem(EXERCISE_PICKER_RECENT_KEY)
    return savedValue ? normalizeExerciseIds(JSON.parse(savedValue)) : []
  } catch {
    storage.removeItem(EXERCISE_PICKER_RECENT_KEY)
    return []
  }
}

export function saveRecentExerciseIds(
  recentIds: string[],
  storage?: Pick<Storage, 'setItem'> | null,
): void {
  if (!storage) {
    return
  }

  storage.setItem(EXERCISE_PICKER_RECENT_KEY, JSON.stringify(recentIds))
}

export function appendRecentExerciseIds(
  currentIds: string[],
  nextIds: string[],
  limit = 12,
): string[] {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const id of [...nextIds, ...currentIds]) {
    const trimmed = id.trim()
    if (!trimmed || seen.has(trimmed)) {
      continue
    }

    seen.add(trimmed)
    merged.push(trimmed)

    if (merged.length >= limit) {
      break
    }
  }

  return merged
}

export function resolveFavoriteExerciseIds(
  exercises: Pick<Exercise, 'id' | 'name'>[],
  favorites: QuickLink[],
): string[] {
  const favoriteSlugs = new Set(
    favorites
      .map((item) => item.path)
      .filter(
        (path): path is string => typeof path === 'string' && path.length > 0,
      )
      .map((path) => {
        const match = path.match(/^\/exercise\/(.+)$/i)
        return match ? match[1].trim().toLowerCase() : ''
      })
      .filter(Boolean),
  )

  return exercises
    .filter((exercise) => {
      const slug = getExerciseSlug(exercise).toLowerCase()
      const id = exercise.id.toLowerCase()
      return favoriteSlugs.has(slug) || favoriteSlugs.has(id)
    })
    .map((exercise) => exercise.id)
}
