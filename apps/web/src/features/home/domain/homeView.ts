import { exercises } from '@gym-pilot/shared'
import { MIN_SEARCH_CHARS } from '../../../constants/home'
import { formatLabel } from '../../../utils/formatUtils'
import { type HomeFilters } from '../../favourites/domain/quickLinks'

type HomeExercise = (typeof exercises)[number]

type HomeViewModel = {
  exerciseList: HomeExercise[]
  categories: string[]
  totalExercises: number
  normalizedCategory: string | null
  hasExplicitAll: boolean
  hasCategoryFilter: boolean
  shouldShowResults: boolean
}

export function normalizeCategory(category: string | null | undefined) {
  return category === null || category === '' ? null : category
}

export function resolveHomeViewModel(filters: HomeFilters) {
  const normalizedCategory = normalizeCategory(filters.selectedCategory)
  const hasExplicitAll = filters.selectedCategory === 'All'
  const hasCategoryFilter = normalizedCategory !== null || hasExplicitAll

  return {
    exerciseList: exercises as HomeExercise[],
    categories: [
      'All',
      ...Array.from(
        new Set(exercises.map((exercise) => formatLabel(exercise.category))),
      ),
    ],
    totalExercises: exercises.length,
    normalizedCategory: normalizedCategory ?? null,
    hasExplicitAll,
    hasCategoryFilter,
    shouldShowResults: exercises.length > 0,
  } satisfies HomeViewModel
}

export function filterExercises(
  exerciseList: HomeViewModel['exerciseList'],
  _filters: HomeFilters,
  normalizedCategory: string | null,
  hasExplicitAll: boolean,
  deferredSearchTerm: string,
) {
  const normalizedSearch = deferredSearchTerm.trim().toLowerCase()
  const shouldApplySearch = normalizedSearch.length >= MIN_SEARCH_CHARS

  return exerciseList.filter((exercise) => {
    const matchesCategory =
      hasExplicitAll ||
      normalizedCategory === null ||
      formatLabel(exercise.category) === normalizedCategory
    const matchesSearch =
      !shouldApplySearch ||
      [exercise.name, exercise.category, exercise.target, exercise.equipment]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)

    return matchesCategory && matchesSearch
  })
}
