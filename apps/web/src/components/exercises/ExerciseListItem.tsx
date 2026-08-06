import { Link } from 'react-router-dom';
import { appTokens } from '../../constants/tokens';
import { formatLabel } from '../../utils/formatUtils';
import { Button } from '../ui/Button';
import { ResponsiveVisibility } from '../visibility/ResponsiveVisibility';
import { ExerciseImage } from './ExerciseImage';
import { ExerciseMetaBadges } from './ExerciseMetaBadges';

type ExerciseActionButtonsProps = {
  exerciseId: string
  isFavorite: boolean
  copiedId: string | null
  onToggleFavoriteExercise?: (exerciseId: string) => void
  onCopyUrl: (exerciseId: string) => Promise<void>
}

function ExerciseActionButtons({
  exerciseId,
  isFavorite,
  copiedId,
  onToggleFavoriteExercise,
  onCopyUrl,
}: ExerciseActionButtonsProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2 self-start">
      <Button
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onToggleFavoriteExercise?.(exerciseId)
        }}
        tone="chip"
        className={`${isFavorite ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}`}
      >
        {isFavorite ? '★ Favourited' : '☆ Favourite'}
      </Button>
      <Button
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void onCopyUrl(exerciseId)
        }}
        tone="chip"
        className={`${copiedId === exerciseId ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}`}
      >
        {copiedId === exerciseId ? 'Copied!' : 'Copy URL'}
      </Button>
    </div>
  )
}

interface ExerciseListItemProps {
  exercise: {
    id: string
    name: string
    category: string
    equipment: string
    image?: string | null
  }
  position: number
  showExerciseImages: boolean
  isExerciseFavorite?: (exerciseId: string) => boolean | undefined
  copiedId: string | null
  onToggleFavoriteExercise?: (exerciseId: string) => void
  onCopyUrl: (exerciseId: string) => Promise<void>
  getExercisePath: (exercise: { id: string; name: string }) => string
}

export function ExerciseListItem({
  exercise,
  position,
  showExerciseImages,
  isExerciseFavorite,
  copiedId,
  onToggleFavoriteExercise,
  onCopyUrl,
  getExercisePath,
}: ExerciseListItemProps) {
  if (showExerciseImages) {
    return (
      <div
        key={exercise.id}
        className="flex h-full min-h-72 gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-slate-600"
      >
        <Link
          to={getExercisePath(exercise)}
          className="flex min-w-0 flex-1 flex-col gap-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold leading-none text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                {position}
              </span>
              <h3 className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
                {formatLabel(exercise.name)}
              </h3>
            </div>
            <ExerciseMetaBadges
              values={[
                formatLabel(exercise.category),
                formatLabel(exercise.equipment),
              ]}
              tones={['orange', 'orange']}
              className="mt-2"
              pillClassName="text-[11px]"
            />
          </div>
          <ExerciseImage
            mediaGif={exercise.image}
            exerciseName={exercise.name}
            className="mt-4"
          />
        </Link>
        <ResponsiveVisibility visibleOn="desktop">
          <ExerciseActionButtons
            exerciseId={exercise.id}
            isFavorite={Boolean(isExerciseFavorite?.(exercise.id))}
            copiedId={copiedId}
            onToggleFavoriteExercise={onToggleFavoriteExercise}
            onCopyUrl={onCopyUrl}
          />
        </ResponsiveVisibility>
      </div>
    )
  }

  return (
    <div
      key={exercise.id}
      className="flex h-full min-h-35 gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-slate-600"
    >
      <Link
        to={getExercisePath(exercise)}
        className="flex min-w-0 flex-1 flex-col gap-2"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
              <span className={`inline-flex h-8 min-w-8 items-center justify-center ${appTokens.pill} font-semibold leading-none text-slate-700 dark:bg-slate-800 dark:text-slate-100`}> 
              {position}
            </span>
            <h3 className="text-base font-semibold leading-tight text-slate-900 dark:text-slate-100">
              {formatLabel(exercise.name)}
            </h3>
          </div>
          <ExerciseMetaBadges
            values={[
              formatLabel(exercise.category),
              formatLabel(exercise.equipment),
            ]}
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
          onCopyUrl={onCopyUrl}
        />
      </ResponsiveVisibility>
    </div>
  )
}
