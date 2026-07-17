import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { List, type RowComponentProps } from 'react-window'
import { getToneClass } from '../components/toneClasses'
import { exercises, exercisesSchema  } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { PageActionRow } from '../components/PageActionRow'
import { PageLayout } from '../layouts/PageLayout'
import { Heading2 } from '../components/Typography'
import { appTokens } from '../constants/tokens'
import { ExerciseMetaBadges } from '../components/ExerciseMetaBadges'
import { ResponsiveVisibility } from '../components/ResponsiveVisibility'
import { ExerciseImage } from '../components/ExerciseImage'
import { MIN_SEARCH_CHARS } from '../constants/home'
import { getExercisePath } from '../utils/exerciseRouteUtils'
import { ExerciseSearchPicker } from '../components/ExerciseSearchPicker'
import { formatLabel } from '../utils/formatUtils'
import { copyExerciseLinkToClipboard } from '../utils/navigationUtils'
import { logger } from '../utils/loggingUtils'

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

type ExerciseListItem = (typeof exercises)[number]
type ExerciseRow = ExerciseListItem[]
type ExerciseRowProps = Record<string, never>

type ExerciseActionButtonsProps = {
  exerciseId: string
  isFavorite: boolean
  copiedId: string | null
  onToggleFavoriteExercise?: (exerciseId: string) => void
  onCopyUrl: (exerciseId: string) => Promise<void>
}

function normalizeCategory(category: string | null | undefined) {
  return category === null || category === '' ? null : category
}

function ExerciseActionButtons({ exerciseId, isFavorite, copiedId, onToggleFavoriteExercise, onCopyUrl }: ExerciseActionButtonsProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2 self-start">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onToggleFavoriteExercise?.(exerciseId)
        }}
        className={getToneClass(isFavorite ? 'blue' : 'white', 'px-3 py-2 text-sm font-medium')}
      >
        {isFavorite ? '★ Favourited' : '☆ Favourite'}
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void onCopyUrl(exerciseId)
        }}
        className={getToneClass('white', 'px-3 py-2 text-sm font-medium')}
      >
        {copiedId === exerciseId ? 'Copied!' : 'Copy URL'}
      </button>
    </div>
  )
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
      copyExerciseLinkToClipboard(exerciseId)
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

  const exerciseRows = useMemo(() => {
    const columns = isLargeScreen ? 2 : 1
    const rows: ExerciseRow[] = []

    for (let index = 0; index < filteredExercises.length; index += columns) {
      rows.push(filteredExercises.slice(index, index + columns) as ExerciseRow)
    }

    return rows
  }, [filteredExercises, isLargeScreen])

  const rowHeight = showExerciseImages ? (isLargeScreen ? 560 : 520) : (isLargeScreen ? 200 : 170)
  const listHeight = Math.min(1400, Math.max(320, exerciseRows.length * rowHeight))

  return (
    <PageLayout className="gap-6">
      <PageCard as="section">
        <div className="mb-5">
          <ExerciseSearchPicker
            id="exercise-search"
            value={draftSearchTerm}
            onChange={(nextValue) => {
              setDraftSearchTerm(nextValue)
            }}
            onSelectExercise={(exercise) => {
              const nextSearchTerm = formatLabel(exercise.name)
              onFiltersChange({ ...filters, searchTerm: nextSearchTerm, selectedCategory: null, showImages: showExerciseImages })
            }}
          />
        </div>

        <div className="mt-4 flex flex-col items-start gap-2">
          <div className="sm:hidden">
            <select
              value={selectedCategory ?? ''}
              onChange={(event) => {
                const nextCategory = event.target.value
                onFiltersChange({ ...filters, searchTerm: draftSearchTerm, selectedCategory: nextCategory === '' ? null : nextCategory === 'All' ? 'All' : nextCategory, showImages: showExerciseImages })
              }}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
            >
              <option value="">No category selected</option>
              <option value="All">All categories</option>
              {categories.filter((category) => category !== 'All').map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
            {categories.map((category) => {
              const isAll = category === 'All'
              const isSelected = isAll ? selectedCategory === 'All' : normalizedCategory === category

              return (
                <button
                  key={category}
                  onClick={() => onFiltersChange({ ...filters, searchTerm: draftSearchTerm, selectedCategory: isAll ? 'All' : category, showImages: showExerciseImages })}
                  className={
                    isSelected
                      ? getToneClass('blue', 'px-4 py-2 text-sm font-medium transition')
                      : getToneClass('default', 'px-4 py-2 text-sm font-medium transition hover:bg-slate-200')
                  }
                >
                  {category}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              const nextShowExerciseImages = !showExerciseImages
              setShowExerciseImages(nextShowExerciseImages)
              onFiltersChange({ ...filters, searchTerm: draftSearchTerm, selectedCategory, showImages: nextShowExerciseImages })
            }}
            className={showExerciseImages ? getToneClass('default', 'w-fit px-4 py-2 text-sm font-medium transition hover:bg-slate-200') : getToneClass('blue', 'w-fit px-4 py-2 text-sm font-medium transition')}
          >
            {showExerciseImages ? 'Hide images' : 'Show images'}
          </button>
        </div>
{/* 
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
          {equipment.map((item) => (
            <button
              key={item}
              onClick={() => setSelectedEquipment((current) => (current === item ? 'All' : item))}
              className={`${
                item === selectedEquipment
                  ? getToneClass('orange', 'px-3 py-2 text-sm')
                  : getToneClass('default', 'px-3 py-2 text-sm hover:bg-slate-200')
              }`}
            >
              {item}
            </button>
          ))}
        </div> */}
      </PageCard>

      <PageCard as="section">
        <PageActionRow className="mb-5 border-b border-slate-200 pb-4">
          <div>
            <Heading2>Exercises</Heading2>
            <p className="text-sm text-slate-600">
              {shouldShowResults
                ? `Showing ${filteredExercises.length} of ${totalExercises} exercises.`
                : hasSearchText && !hasSearchThreshold
                  ? `Type at least ${MIN_SEARCH_CHARS} characters to search.`
                  : 'Start typing or choose a category to reveal exercises.'}
            </p>
          </div>
          {normalizedCategory ? <div className={appTokens.pill}>Category: {normalizedCategory}</div> : null}
        </PageActionRow>

        {shouldShowResults ? (
          <div className="overflow-hidden rounded-2xl [&::-webkit-scrollbar]:hidden">
            <List
              defaultHeight={listHeight}
              rowCount={exerciseRows.length}
              rowHeight={rowHeight}
              style={{ height: listHeight, width: '100%', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              overscanCount={3}
              rowProps={{} as ExerciseRowProps}
              rowComponent={({ index, style }: RowComponentProps<ExerciseRowProps>) => {
                const row = exerciseRows[index]

                return (
                  <div
                    style={style}
                    className={showExerciseImages ? 'w-full px-1 py-3' : 'w-full px-0 py-0'}
                  >
                    <div className={showExerciseImages ? `grid items-start gap-4 md:gap-6 ${isLargeScreen ? 'lg:grid-cols-2' : 'grid-cols-1'}` : `grid items-start gap-1 md:gap-1.5 ${isLargeScreen ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                      {row.map((exercise) => {
                        const position = filteredExercises.findIndex((item) => item.id === exercise.id) + 1

                        if (showExerciseImages) {
                          return (
                            <div
                              key={exercise.id}
                              className="flex h-full min-h-75 cursor-pointer gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-slate-600"
                            >
                              <Link to={getExercisePath(exercise)} className="flex min-w-0 flex-1 flex-col gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold leading-none text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                      {position}
                                    </span>
                                    <h3 className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-100">{formatLabel(exercise.name)}</h3>
                                  </div>
                                  <ExerciseMetaBadges
                                    values={[formatLabel(exercise.category), formatLabel(exercise.equipment)]}
                                    tones={['blue', 'orange']}
                                    className="mt-2"
                                    pillClassName="text-xs"
                                  />
                                </div>
                                <ExerciseImage mediaGif={exercise.image} exerciseName={exercise.name} className="mt-6" />
                              </Link>
                              <ResponsiveVisibility visibleOn="desktop">
                                <ExerciseActionButtons
                                  exerciseId={exercise.id}
                                  isFavorite={Boolean(isExerciseFavorite?.(exercise.id))}
                                  copiedId={copiedId}
                                  onToggleFavoriteExercise={onToggleFavoriteExercise}
                                  onCopyUrl={handleCopyUrl}
                                />
                              </ResponsiveVisibility>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={exercise.id}
                            className="flex h-full min-h-35 cursor-pointer gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-slate-600"
                          >
                            <Link to={getExercisePath(exercise)} className="flex min-w-0 flex-1 flex-col gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold leading-none text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                    {position}
                                  </span>
                                  <h3 className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-100">{formatLabel(exercise.name)}</h3>
                                </div>
                                <ExerciseMetaBadges
                                  values={[formatLabel(exercise.category), formatLabel(exercise.equipment)]}
                                  tones={['blue', 'orange']}
                                  className="mt-1"
                                  pillClassName="text-xs"
                                />
                              </div>
                            </Link>
                            <ResponsiveVisibility visibleOn="desktop">
                              <ExerciseActionButtons
                                exerciseId={exercise.id}
                                isFavorite={Boolean(isExerciseFavorite?.(exercise.id))}
                                copiedId={copiedId}
                                onToggleFavoriteExercise={onToggleFavoriteExercise}
                                onCopyUrl={handleCopyUrl}
                              />
                            </ResponsiveVisibility>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              }}
            />
          </div>
        ) : (
         null
        )}
      </PageCard>
    </PageLayout>
  )
}
