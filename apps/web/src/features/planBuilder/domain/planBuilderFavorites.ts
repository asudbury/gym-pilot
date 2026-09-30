import type { QuickLink } from '../../favourites/domain/quickLinks'
import { getExercisePath } from '../../../utils/exerciseRouteUtils'

export type FavoritePlanBuilderExercise = {
  id: string
  name: string
}

export type FavoritePlanBuilderState = {
  favoriteExerciseIds: string[]
  favoriteLinks: QuickLink[]
}

/**
 * Derives the plan builder's favorite exercises and links from stored favorites data.
 * Exercises already present in the active tab rows are excluded from the result
 * to avoid suggesting duplicates.
 *
 * @param storedValue - The raw stored favorites object (favorites array + folders).
 * @param activeRows - The rows currently visible in the active plan tab.
 * @param exercises - The full exercise library to resolve paths against.
 * @returns FavoritePlanBuilderState with resolved exercise IDs and link objects.
 */
export function buildFavoritePlanBuilderState(
  storedValue: {
    favorites?: Array<Partial<QuickLink> | null> | undefined
    folders?: string[] | undefined
  },
  activeRows: Array<{ exerciseId?: string | null }>,
  exercises: FavoritePlanBuilderExercise[],
): FavoritePlanBuilderState {
  const favoritePaths = new Set(
    (storedValue.favorites ?? [])
      .filter(
        (item): item is Partial<QuickLink> & { path: string; label: string } =>
          Boolean(
            item &&
            typeof item.path === 'string' &&
            typeof item.label === 'string',
          ),
      )
      .map((item) => item.path),
  )
  const selectedExerciseIds = new Set(
    activeRows.filter((row) => row.exerciseId).map((row) => row.exerciseId),
  )

  const favoriteExerciseIds = exercises
    .filter(
      (exercise) =>
        favoritePaths.has(getExercisePath(exercise)) &&
        !selectedExerciseIds.has(exercise.id),
    )
    .map((exercise) => exercise.id)

  const favoriteLinks = (storedValue.favorites ?? [])
    .filter(
      (item): item is Partial<QuickLink> & { path: string; label: string } =>
        typeof item?.path === 'string' && typeof item?.label === 'string',
    )
    .map((item) => ({
      id: item.id ?? `${item.label}-${item.path}`,
      label: item.label,
      path: item.path,
      folder: item.folder ? item.folder.trim() : undefined,
    }))

  return {
    favoriteExerciseIds,
    favoriteLinks,
  }
}
