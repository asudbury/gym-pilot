import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { MIN_SEARCH_CHARS } from '../constants/home'
import { copyExerciseLinkToClipboard } from '../utils/navigationUtils'
import { logger } from '@gym-pilot/shared'
import { ExerciseFilterPanel } from '../components/exercises/ExerciseFilterPanel'
import { ExerciseResultsHeader } from '../components/exercises/ExerciseResultsHeader'
import { ExerciseList } from '../components/exercises/ExerciseList'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import {
  filterExercises,
  resolveHomeViewModel,
  type HomeFilters,
} from '../features/home/domain/homeView'

type HomePageProps = {
  filters: HomeFilters
  onFiltersChange: (filters: HomeFilters) => void
  onToggleFavoriteExercise?: (exerciseId: string) => void
  isExerciseFavorite?: (exerciseId: string) => boolean
}

export function HomePage({
  filters,
  onFiltersChange,
  onToggleFavoriteExercise,
  isExerciseFavorite,
}: HomePageProps) {
  logger.debug('Rendering HomePage with filters:', filters)

  const { selectedCategory } = filters
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [draftSearchTerm, setDraftSearchTerm] = useState(filters.searchTerm)
  const [showExerciseImages, setShowExerciseImages] = useState(
    filters.showImages,
  )
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    return window.matchMedia('(min-width: 1024px)').matches
  })
  const deferredSearchTerm = useDeferredValue(draftSearchTerm)
  const trimmedSearchTerm = draftSearchTerm.trim()
  const viewModel = useMemo(() => resolveHomeViewModel(filters), [filters])
  const normalizedCategory = viewModel.normalizedCategory
  const hasExplicitAll = viewModel.hasExplicitAll
  const hasSearchText = viewModel.hasSearchText
  const hasSearchThreshold = viewModel.hasSearchThreshold
  const shouldShowResults = viewModel.shouldShowResults

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

    if (
      trimmedSearchTerm.length > 0 &&
      trimmedSearchTerm.length < MIN_SEARCH_CHARS
    ) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      onFiltersChange({ ...filters, searchTerm: draftSearchTerm })
    }, 80)

    return () => window.clearTimeout(timeoutId)
  }, [draftSearchTerm, filters, onFiltersChange, trimmedSearchTerm])

  const { exerciseList, categories, totalExercises } = viewModel

  const handleCopyUrl = async (exerciseId: string) => {
    logger.debug(`Copying URL for exercise: ${exerciseId}`)

    try {
      await copyExerciseLinkToClipboard(exerciseId)
      setCopiedId(exerciseId)
      window.setTimeout(
        () =>
          setCopiedId((current) => (current === exerciseId ? null : current)),
        1500,
      )
    } catch {
      setCopiedId(null)
    }
  }

  const filteredExercises = useMemo(() => {
    return filterExercises(
      exerciseList,
      filters,
      normalizedCategory,
      hasExplicitAll,
      deferredSearchTerm,
    )
  }, [
    exerciseList,
    deferredSearchTerm,
    filters,
    hasExplicitAll,
    normalizedCategory,
  ])

  return (
    <PageLayout className="gap-6">
      

      <PageCard as="section">
        <div className="mb-4 flex items-start gap-3">
          <DecorativeIcon icon="dumbbell" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Discover exercises
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Browse by category or search for the movement you need.
            </p>
          </div>
        </div>
        <ExerciseFilterPanel
          draftSearchTerm={draftSearchTerm}
          selectedCategory={selectedCategory}
          categories={categories}
          normalizedCategory={normalizedCategory ?? null}
          showExerciseImages={showExerciseImages}
          onSearchChange={(nextValue) => setDraftSearchTerm(nextValue)}
          onSelectExercise={(nextSearchTerm) =>
            onFiltersChange({
              ...filters,
              searchTerm: nextSearchTerm,
              selectedCategory: null,
              showImages: showExerciseImages,
            })
          }
          onCategoryChange={(nextCategory) =>
            onFiltersChange({
              ...filters,
              searchTerm: draftSearchTerm,
              selectedCategory: nextCategory,
              showImages: showExerciseImages,
            })
          }
          onToggleImages={() => {
            const nextShowExerciseImages = !showExerciseImages
            setShowExerciseImages(nextShowExerciseImages)
            onFiltersChange({
              ...filters,
              searchTerm: draftSearchTerm,
              selectedCategory,
              showImages: nextShowExerciseImages,
            })
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
