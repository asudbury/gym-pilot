import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { List, type RowComponentProps } from 'react-window'
import { ExerciseMetaBadges } from './ExerciseMetaBadges'
import { ExerciseImage } from './ExerciseImage'
import { ResponsiveVisibility } from '../ResponsiveVisibility'
import { getExercisePath } from '../../utils/exerciseRouteUtils'
import { formatLabel } from '../../utils/formatUtils'
import type { exercises } from '@gym-pilot/shared'

type ExerciseListItem = (typeof exercises)[number]
type ExerciseRow = ExerciseListItem[]

type ExerciseListProps = {
  exercises: ExerciseListItem[]
  isLargeScreen: boolean
  showExerciseImages: boolean
  copiedId: string | null
  isExerciseFavorite?: (exerciseId: string) => boolean
  onToggleFavoriteExercise?: (exerciseId: string) => void
  onCopyUrl: (exerciseId: string) => Promise<void>
}

type ExerciseActionButtonsProps = {
  exerciseId: string
  isFavorite: boolean
  copiedId: string | null
  onToggleFavoriteExercise?: (exerciseId: string) => void
  onCopyUrl: (exerciseId: string) => Promise<void>
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
          window.dispatchEvent(new Event('gym-pilot-open-favourites-menu'))
        }}
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
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
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        {copiedId === exerciseId ? 'Copied!' : 'Copy URL'}
      </button>
    </div>
  )
}

export function ExerciseList({ exercises, isLargeScreen, showExerciseImages, copiedId, isExerciseFavorite, onToggleFavoriteExercise, onCopyUrl }: ExerciseListProps) {
  const exerciseRows = useMemo(() => {
    const columns = isLargeScreen ? 2 : 1
    const rows: ExerciseRow[] = []

    for (let index = 0; index < exercises.length; index += columns) {
      rows.push(exercises.slice(index, index + columns) as ExerciseRow)
    }

    return rows
  }, [exercises, isLargeScreen])

  const rowHeight = showExerciseImages ? (isLargeScreen ? 560 : 520) : (isLargeScreen ? 200 : 170)
  const listHeight = Math.min(1400, Math.max(320, exerciseRows.length * rowHeight))

  return (
    <div className="overflow-hidden rounded-2xl [&::-webkit-scrollbar]:hidden">
      <List
        defaultHeight={listHeight}
        rowCount={exerciseRows.length}
        rowHeight={rowHeight}
        style={{ height: listHeight, width: '100%', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        overscanCount={3}
        rowProps={{} as Record<string, never>}
        rowComponent={({ index, style }: RowComponentProps<Record<string, never>>) => {
          const row = exerciseRows[index]

          return (
            <div style={style} className={showExerciseImages ? 'w-full px-1 py-3' : 'w-full px-0 py-0'}>
              <div className={showExerciseImages ? `grid items-start gap-4 md:gap-6 ${isLargeScreen ? 'lg:grid-cols-2' : 'grid-cols-1'}` : `grid items-start gap-1 md:gap-1.5 ${isLargeScreen ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                {row.map((exercise: ExerciseListItem) => {
                  const position = exercises.findIndex((item) => item.id === exercise.id) + 1

                  if (showExerciseImages) {
                    return (
                      <div key={exercise.id} className="flex h-full min-h-75 cursor-pointer gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-slate-600">
                        <Link to={getExercisePath(exercise)} className="flex min-w-0 flex-1 flex-col gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold leading-none text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                {position}
                              </span>
                              <h3 className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-100">{formatLabel(exercise.name)}</h3>
                            </div>
                            <ExerciseMetaBadges values={[formatLabel(exercise.category), formatLabel(exercise.equipment)]} tones={['blue', 'orange']} className="mt-2" pillClassName="text-xs" />
                          </div>
                          <ExerciseImage mediaGif={exercise.image} exerciseName={exercise.name} className="mt-6" />
                        </Link>
                        <ResponsiveVisibility visibleOn="desktop">
                          <ExerciseActionButtons exerciseId={exercise.id} isFavorite={Boolean(isExerciseFavorite?.(exercise.id))} copiedId={copiedId} onToggleFavoriteExercise={onToggleFavoriteExercise} onCopyUrl={onCopyUrl} />
                        </ResponsiveVisibility>
                      </div>
                    )
                  }

                  return (
                    <div key={exercise.id} className="flex h-full min-h-35 cursor-pointer gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-slate-600">
                      <Link to={getExercisePath(exercise)} className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold leading-none text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                              {position}
                            </span>
                            <h3 className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-100">{formatLabel(exercise.name)}</h3>
                          </div>
                          <ExerciseMetaBadges values={[formatLabel(exercise.category), formatLabel(exercise.equipment)]} tones={['blue', 'orange']} className="mt-1" pillClassName="text-xs" />
                        </div>
                      </Link>
                      <ResponsiveVisibility visibleOn="desktop">
                        <ExerciseActionButtons exerciseId={exercise.id} isFavorite={Boolean(isExerciseFavorite?.(exercise.id))} copiedId={copiedId} onToggleFavoriteExercise={onToggleFavoriteExercise} onCopyUrl={onCopyUrl} />
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
  )
}
