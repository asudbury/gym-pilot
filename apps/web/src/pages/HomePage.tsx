import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { exercises, exercisesSchema } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { MIN_SEARCH_CHARS } from '../constants/home'
import { formatLabel } from '../utils/formatUtils'
import { copyExerciseLinkToClipboard } from '../utils/navigationUtils'
import { logger } from '../utils/loggingUtils'
import { ExerciseFilterPanel } from '../components/exercises/ExerciseFilterPanel'
import { ExerciseResultsHeader } from '../components/exercises/ExerciseResultsHeader'
import { ExerciseList } from '../components/exercises/ExerciseList'

type HomeFilters = {
  searchTerm: string
  selectedCategory: string | null
  showImages: boolean
}

type HomePageProps = {
  filters: HomeFilters
  onFiltersChange: (filters: HomeFilters) => void
  onToggleFavoriteExercise?: (exerciseId: string) => void
  isExerciseFavorite?: (exerciseId: string) => boolean
}

function normalizeCategory(category: string | null | undefined) {
  return category === null || category === '' ? null : category
}

export function HomePage({ filters, onFiltersChange, onToggleFavoriteExercise, isExerciseFavorite }: HomePageProps) {
  
  logger.debug('Rendering HomePage with filters:', filters)
  
  const { selectedCategory } = filters
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [draftSearchTerm, setDraftSearchTerm] = useState(filters.searchTerm)
  const [showExerciseImages, setShowExerciseImages] = useState(filters.showImages)
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    return window.matchMedia('(min-width: 1024px)').matches
  })
  const deferredSearchTerm = useDeferredValue(draftSearchTerm)
  const trimmedSearchTerm = draftSearchTerm.trim()
  const normalizedCategory = normalizeCategory(selectedCategory)
  const hasExplicitAll = selectedCategory === 'All'
  const hasCategoryFilter = normalizedCategory !== null || hasExplicitAll
  const hasSearchText = trimmedSearchTerm.length > 0
  const hasSearchThreshold = trimmedSearchTerm.length >= MIN_SEARCH_CHARS
  const shouldShowResults = hasCategoryFilter || (hasSearchText && hasSearchThreshold)

  useEffect(() => {
    setDraftSearchTerm(filters.searchTerm)
  }, [filters.searchTerm])

  useEffect(() => {
    setShowExerciseImages(filters.showImages)
  }, [filters.showImages])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const updateViewport = () => setIsLargeScreen(mediaQuery.matches)

    updateViewport()
    mediaQuery.addEventListener?.('change', updateViewport)

    return () => mediaQuery.removeEventListener?.('change', updateViewport)
  }, [])

  useEffect(() => {
    if (draftSearchTerm === filters.searchTerm) {
      return
    }

    if (trimmedSearchTerm.length > 0 && trimmedSearchTerm.length < MIN_SEARCH_CHARS) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      onFiltersChange({ ...filters, searchTerm: draftSearchTerm })
    }, 80)

    return () => window.clearTimeout(timeoutId)
  }, [draftSearchTerm, filters, onFiltersChange, trimmedSearchTerm])

  const { exerciseList, categories, totalExercises } = useMemo(() => {
    const parsed = exercisesSchema.parse(exercises)

    return {
      exerciseList: parsed,
      categories: ['All', ...Array.from(new Set(parsed.map((exercise) => formatLabel(exercise.category))))],
      equipment: ['All', ...Array.from(new Set(parsed.map((exercise) => formatLabel(exercise.equipment))))],
      totalExercises: parsed.length,
    }
  }, [])

  const handleCopyUrl = async (exerciseId: string) => {
    logger.debug(`Copying URL for exercise: ${exerciseId}`)

    try {
      await copyExerciseLinkToClipboard(exerciseId)
      setCopiedId(exerciseId)
      window.setTimeout(() => setCopiedId((current) => (current === exerciseId ? null : current)), 1500)
    } catch {
      setCopiedId(null)
    }
  }

  const filteredExercises = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase()
    const shouldApplySearch = normalizedSearch.length >= MIN_SEARCH_CHARS

    return exerciseList.filter((exercise) => {
      const matchesCategory = hasExplicitAll || normalizedCategory === null || formatLabel(exercise.category) === normalizedCategory
      const matchesSearch =
        !shouldApplySearch ||
        [exercise.name, exercise.category, exercise.target, exercise.equipment].join(' ').toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [exerciseList, deferredSearchTerm, hasExplicitAll, normalizedCategory])

  return (
    <PageLayout className="gap-6">
      <PageCard as="section">
        <ExerciseFilterPanel
          draftSearchTerm={draftSearchTerm}
          selectedCategory={selectedCategory}
          categories={categories}
          normalizedCategory={normalizedCategory ?? null}
          showExerciseImages={showExerciseImages}
          onSearchChange={(nextValue) => setDraftSearchTerm(nextValue)}
          onSelectExercise={(nextSearchTerm) => onFiltersChange({ ...filters, searchTerm: nextSearchTerm, selectedCategory: null, showImages: showExerciseImages })}
          onCategoryChange={(nextCategory) => onFiltersChange({ ...filters, searchTerm: draftSearchTerm, selectedCategory: nextCategory, showImages: showExerciseImages })}
          onToggleImages={() => {
            const nextShowExerciseImages = !showExerciseImages
            setShowExerciseImages(nextShowExerciseImages)
            onFiltersChange({ ...filters, searchTerm: draftSearchTerm, selectedCategory, showImages: nextShowExerciseImages })
          }}
        />
      </PageCard>

      <PageCard as="section">
        <ExerciseResultsHeader
          filteredExercisesCount={filteredExercises.length}
          totalExercises={totalExercises}
          shouldShowResults={shouldShowResults}
          hasSearchText={hasSearchText}
          hasSearchThreshold={hasSearchThreshold}
          normalizedCategory={normalizedCategory ?? null}
        />

        {shouldShowResults ? (
          <ExerciseList
            exercises={filteredExercises}
            isLargeScreen={isLargeScreen}
            showExerciseImages={showExerciseImages}
            copiedId={copiedId}
            isExerciseFavorite={isExerciseFavorite}
            onToggleFavoriteExercise={onToggleFavoriteExercise}
            onCopyUrl={handleCopyUrl}
          />
        ) : null}
      </PageCard>
    </PageLayout>
  )
}
