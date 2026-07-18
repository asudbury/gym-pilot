import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ExerciseImage } from '../components/exercises/ExerciseImage'
import { ExerciseSteps } from '../components/exercises/ExerciseSteps'
import { YouTubeExerciseSearchButton } from '../components/exercises/YouTubeExerciseSearchButton'
import { exercises, exercisesSchema } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { PageActionGroup, PageActionRow } from '../components/PageActionRow'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'
import { ExerciseMetaBadges } from '../components/exercises/ExerciseMetaBadges'
import { formatLabel } from '../utils/formatUtils'
import { logger } from '@gym-pilot/shared'
import { copyExerciseLinkToClipboard } from '../utils/navigationUtils'
import { resolveExercisePageViewModel } from '../features/exercises/domain/exerciseView'

type ExercisePageProps = {
  onToggleFavoriteExercise?: (exerciseId: string) => void
  isExerciseFavorite?: (exerciseId: string) => boolean
}

export function ExercisePage({ onToggleFavoriteExercise, isExerciseFavorite }: ExercisePageProps) {
  
  logger.debug('Rendering ExercisePage')
  
  const { slug } = useParams()
  const [copied, setCopied] = useState(false)

  const viewModel = useMemo(() => {
    const parsed = exercisesSchema.parse(exercises)
    return resolveExercisePageViewModel(slug, parsed)
  }, [slug])

  const exercise = viewModel.exercise
  const mediaGif = viewModel.mediaGif

  const handleCopyUrl = async () => {
    try {
      if (!exercise?.id) {
        return
      }

      await copyExerciseLinkToClipboard(exercise.id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const handleOpenFavouritePicker = () => {
    onToggleFavoriteExercise?.(exercise?.id ?? '')
    window.dispatchEvent(new Event('gym-pilot-open-favourites-menu'))
  }

  if (!exercise) {
    return (
      <PageLayout className="max-w-3xl">
        <PageCard padding="spacious">
          <Paragraph>Exercise</Paragraph>
          <Heading1 className="mt-3">Exercise not found</Heading1>
        </PageCard>
      </PageLayout>
    )
  }

  return (
    <PageLayout className="max-w-6xl">
      <PageCard padding="spacious">
        <PageActionRow className="items-start gap-4 border-b-2 border-slate-200 pb-3">
          <div className="min-w-0">
            <Heading1 className="mt-0">{formatLabel(exercise.name)}</Heading1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ExerciseMetaBadges
                values={[formatLabel(exercise.body_part), formatLabel(exercise.equipment), formatLabel(exercise.target)]}
                tones={['blue', 'orange', 'default']}
              />
            </div>
          </div>
        </PageActionRow>
        <ExerciseImage mediaGif={mediaGif} exerciseName={exercise.name} className="mt-6" />
        <YouTubeExerciseSearchButton exerciseName={exercise.name} />
        <ExerciseSteps steps={exercise.instruction_steps.en} className="mt-8" />
        <PageActionGroup className="mt-6 flex-col sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleOpenFavouritePicker}
            className={isExerciseFavorite?.(exercise.id)
              ? 'cursor-pointer rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white'
              : 'cursor-pointer rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors dark:bg-slate-800 dark:text-slate-100'}
          >
            {isExerciseFavorite?.(exercise.id) ? 'Manage favourite' : 'Add to Favourites'}
          </button>
          <button
            type="button"
            onClick={handleCopyUrl}
            className={copied
              ? 'cursor-pointer rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white'
              : 'cursor-pointer rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors dark:bg-slate-800 dark:text-slate-100'}
          >
            {copied ? 'Copied!' : 'Copy URL'}
          </button>
        </PageActionGroup>
      </PageCard>
    </PageLayout>
  )
}
