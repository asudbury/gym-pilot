import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageCard } from '../components/PageCard'
import { PageActionRow } from '../components/PageActionRow'
import { PageLayout } from '../layouts/PageLayout'
import { Heading2 } from '../components/Typography'
import { getToneClass } from '../components/toneClasses'
import { ExerciseImage } from '../components/ExerciseImage'
import { ExerciseMetaBadges } from '../components/ExerciseMetaBadges'
import { exercises, exercisesSchema, formatLabel } from '@gym-pilot/shared'

type QuickLink = {
  id: string
  label: string
  path: string
}

type FavouritesPageProps = {
  favorites: QuickLink[]
  onToggleFavoriteExercise?: (exerciseId: string) => void
  isExerciseFavorite?: (exerciseId: string) => boolean
}

export function FavouritesPage({ favorites, onToggleFavoriteExercise, isExerciseFavorite }: FavouritesPageProps) {
  const exerciseIds = favorites
    .map((link) => link.path.match(/^\/exercise\/(.+)$/)?.[1])
    .filter((id): id is string => Boolean(id))

  const favouriteExercises = useMemo(() => {
    const parsed = exercisesSchema.parse(exercises)
    return parsed.filter((exercise) => exerciseIds.includes(exercise.id))
  }, [exerciseIds])

  return (
    <PageLayout className="gap-6">
      <PageCard as="section">
        <PageActionRow className="mb-5 border-b border-slate-200 pb-4">
          <div>
            <Heading2>Favourites</Heading2>
            <p className="text-sm text-slate-600">
              {favouriteExercises.length > 0
                ? 'Your saved exercises are ready to revisit.'
                : 'Add exercises from the home page or exercise details to build your favourites list.'}
            </p>
          </div>
        </PageActionRow>

        {favouriteExercises.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {favouriteExercises.map((exercise) => (
              <div key={exercise.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                  <ExerciseImage mediaGif={exercise.image} exerciseName={exercise.name} className="mt-2" />
                </Link>
                <button
                  type="button"
                  onClick={() => onToggleFavoriteExercise?.(exercise.id)}
                  className={getToneClass('default', 'px-3 py-2 text-sm font-medium')}
                >
                  {isExerciseFavorite?.(exercise.id) ? '★ Added' : '☆ Add'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
            No favourites yet.
          </div>
        )}
      </PageCard>
    </PageLayout>
  )
}
