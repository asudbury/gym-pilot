import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { List, type RowComponentProps } from 'react-window'
import { getToneClass } from '../components/toneClasses'
import { exercises, exercisesSchema, formatLabel } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { PageActionRow } from '../components/PageActionRow'
import { PageLayout } from '../layouts/PageLayout'
import { Heading2 } from '../components/Typography'
import { appTokens } from '../constants/tokens'
import { ExerciseMetaBadges } from '../components/ExerciseMetaBadges'
import { ResponsiveVisibility } from '../components/ResponsiveVisibility'
import { ExerciseImage } from '../components/ExerciseImage'
import { MIN_SEARCH_CHARS } from '../constants/home'

type HomeFilters = {
  searchTerm: string
  selectedCategory: string | null
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

function normalizeCategory(category: string | null | undefined) {
  return category === null || category === '' || category === 'All' ? null : category
}

export function HomePage({ filters, onFiltersChange, onToggleFavoriteExercise, isExerciseFavorite }: HomePageProps) {
  const { selectedCategory } = filters
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [draftSearchTerm, setDraftSearchTerm] = useState(filters.searchTerm)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    return window.matchMedia('(min-width: 1024px)').matches
  })
  const deferredSearchTerm = useDeferredValue(draftSearchTerm)
  const trimmedSearchTerm = draftSearchTerm.trim()
  const normalizedCategory = normalizeCategory(selectedCategory)
  const hasCategoryFilter = normalizedCategory !== null
  const hasSearchText = trimmedSearchTerm.length > 0
  const hasSearchThreshold = trimmedSearchTerm.length >= MIN_SEARCH_CHARS
  const shouldShowResults = !hasSearchText || hasCategoryFilter || hasSearchThreshold

  useEffect(() => {
    setDraftSearchTerm(filters.searchTerm)
  }, [filters.searchTerm])

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
    const url = `${window.location.origin}/exercise/${exerciseId}`

    try {
      await navigator.clipboard.writeText(url)
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
      const matchesCategory = normalizedCategory === null || formatLabel(exercise.category) === normalizedCategory
      const matchesSearch =
        !shouldApplySearch ||
        [exercise.name, exercise.category, exercise.target, exercise.equipment].join(' ').toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [exerciseList, deferredSearchTerm, normalizedCategory])

  const searchSuggestions = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase()

    if (!normalizedSearch || normalizedSearch.length < MIN_SEARCH_CHARS) {
      return []
    }

    return exerciseList
      .filter((exercise) => {
        const searchableText = [exercise.name, exercise.category, exercise.target, exercise.equipment].join(' ').toLowerCase()
        return searchableText.includes(normalizedSearch)
      })
      .slice(0, 6)
  }, [exerciseList, deferredSearchTerm])

  const exerciseRows = useMemo(() => {
    const columns = isLargeScreen ? 2 : 1
    const rows: ExerciseRow[] = []

    for (let index = 0; index < filteredExercises.length; index += columns) {
      rows.push(filteredExercises.slice(index, index + columns) as ExerciseRow)
    }

    return rows
  }, [filteredExercises, isLargeScreen])

  const rowHeight = isLargeScreen ? 620 : 520
  const listHeight = Math.min(1400, Math.max(760, exerciseRows.length * rowHeight))

  return (
    <PageLayout className="gap-6">
      <PageCard as="section">
        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="exercise-search">
            Search exercises
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="exercise-search"
                type="text"
                value={draftSearchTerm}
                onChange={(event) => {
                  setDraftSearchTerm(event.target.value)
                  if (event.target.value.trim().length >= MIN_SEARCH_CHARS) {
                    setShowSuggestions(true)
                  } else {
                    setShowSuggestions(false)
                  }
                }}
                placeholder="Try abs, chest, cable..."
                className={`${appTokens.input} pr-10 outline-none ring-0 focus:border-slate-400`}
              />
              {draftSearchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftSearchTerm('')
                    setShowSuggestions(false)
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-600"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {showSuggestions && searchSuggestions.length > 0 && hasSearchThreshold && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Suggestions
              </p>
              <div className="flex flex-col gap-1">
                {searchSuggestions.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => {
                      const nextSearchTerm = formatLabel(exercise.name)
                      setDraftSearchTerm(nextSearchTerm)
                      setShowSuggestions(false)
                      onFiltersChange({ ...filters, searchTerm: nextSearchTerm, selectedCategory: null })
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-white hover:text-slate-900"
                  >
                    <span className="font-medium">{formatLabel(exercise.name)}</span>
                    <span className="text-xs text-slate-500">{formatLabel(exercise.category)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {categories.map((category) => {
            const isAll = category === 'All'
            const isSelected = isAll ? normalizedCategory === null : normalizedCategory === category

            return (
              <button
                key={category}
                onClick={() => onFiltersChange({ ...filters, searchTerm: draftSearchTerm, selectedCategory: isAll ? null : category })}
                className={`${
                  isSelected
                    ? getToneClass('blue', 'px-4 py-2 text-sm font-medium transition')
                    : getToneClass('default', 'px-4 py-2 text-sm font-medium transition hover:bg-slate-200')
                }`}
              >
                {category}
              </button>
            )
          })}
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
          <div className={appTokens.pill}>{normalizedCategory ? `Category: ${normalizedCategory}` : 'All categories'}</div>
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
                  <div style={style} className="w-full px-1 py-4">
                    <div className={`grid gap-4 md:gap-6 ${isLargeScreen ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                      {row.map((exercise) => (
                        <div
                          key={exercise.id}
                          className={`flex h-full cursor-pointer gap-4 rounded-2xl ${appTokens.surfaceSoft} p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md`}
                        >
                          <Link to={`/exercise/${exercise.id}`} className="flex min-w-0 flex-1 flex-col gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-semibold text-slate-900">{formatLabel(exercise.name)}</h3>
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
                            <div className="flex shrink-0 flex-col gap-2 self-start">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  onToggleFavoriteExercise?.(exercise.id)
                                }}
                                className={getToneClass(isExerciseFavorite?.(exercise.id) ? 'emerald' : 'white', 'px-3 py-2 text-sm font-medium')}
                              >
                                {isExerciseFavorite?.(exercise.id) ? '★ Saved' : '☆ Save'}
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  void handleCopyUrl(exercise.id)
                                }}
                                className={getToneClass('white', 'px-3 py-2 text-sm font-medium')}
                              >
                                {copiedId === exercise.id ? 'Copied!' : 'Copy URL'}
                              </button>
                            </div>
                          </ResponsiveVisibility>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
            Search by name or choose a category to see exercises.
          </div>
        )}
      </PageCard>
    </PageLayout>
  )
}
