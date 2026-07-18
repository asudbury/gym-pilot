import { exercises, exercisesSchema } from '@gym-pilot/shared'
import { formatLabel } from '../../../utils/formatUtils'
import { MIN_SEARCH_CHARS } from '../../../constants/home'

export type HomeExercise = (typeof exercises)[number]

export type HomeFilters = {
  searchTerm: string
  selectedCategory: string | null
  showImages: boolean
}

export type HomeViewModel = {
  exerciseList: HomeExercise[]
  categories: string[]
  totalExercises: number
  normalizedCategory: string | null
  hasExplicitAll: boolean
  hasCategoryFilter: boolean
  hasSearchText: boolean
  hasSearchThreshold: boolean
  shouldShowResults: boolean
}

export function normalizeCategory(category: string | null | undefined) {
  return category === null || category === '' ? null : category
}

export function resolveHomeViewModel(filters: HomeFilters) {
  const parsed = exercisesSchema.parse(exercises)
  const trimmedSearchTerm = filters.searchTerm.trim()
  const normalizedCategory = normalizeCategory(filters.selectedCategory)
  const hasExplicitAll = filters.selectedCategory === 'All'
  const hasCategoryFilter = normalizedCategory !== null || hasExplicitAll
  const hasSearchText = trimmedSearchTerm.length > 0
  const hasSearchThreshold = trimmedSearchTerm.length >= MIN_SEARCH_CHARS

  return {
    exerciseList: parsed as HomeExercise[],
    categories: [
      'All',
      ...Array.from(
        new Set(parsed.map((exercise) => formatLabel(exercise.category))),
      ),
    ],
    totalExercises: parsed.length,
    normalizedCategory: normalizedCategory ?? null,
    hasExplicitAll,
    hasCategoryFilter,
    hasSearchText,
    hasSearchThreshold,
    shouldShowResults:
      hasCategoryFilter || (hasSearchText && hasSearchThreshold),
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
