import { exercises, exercisesSchema } from '@gym-pilot/shared'
import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { PageActionGroup, PageActionRow } from '../components/PageActionRow'
import { PageCard } from '../components/PageCard'
import { Heading1, Paragraph } from '../components/Typography'
import { ExerciseImage } from '../components/exercises/ExerciseImage'
import { ExerciseMetaBadges } from '../components/exercises/ExerciseMetaBadges'
import { ExerciseSteps } from '../components/exercises/ExerciseSteps'
import { YouTubeExerciseSearchButton } from '../components/exercises/YouTubeExerciseSearchButton'
import BackLink from '../components/ui/BackLink'
import { Button } from '../components/ui/Button'
import { useAppShell } from '../features/app-shell/hooks/useAppShell'
import { resolveExercisePageViewModel } from '../features/exercises/domain/exerciseView'
import { PageLayout } from '../layouts/PageLayout'
import { formatLabel } from '../utils/formatUtils'
import { copyExerciseLinkToClipboard } from '../utils/navigationUtils'

export function ExercisePage() {
  const {
    handleToggleFavoriteExercise: onToggleFavoriteExercise,
    isExerciseFavorite,
  } = useAppShell()
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const [copied, setCopied] = useState(false)

  const backTo = searchParams.get('backTo')
  const backLabel = searchParams.get('backLabel')

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
        <PageActionRow className="flex-wrap items-start gap-4 border-b-2 border-slate-200 pb-3">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              {' '}
              <Heading1 className="mt-0">{formatLabel(exercise.name)}</Heading1>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ExerciseMetaBadges
                values={[
                  formatLabel(exercise.body_part),
                  formatLabel(exercise.equipment),
                  formatLabel(exercise.target),
                ]}
                tones={['orange', 'orange', 'orange']}
              />
            </div>
          </div>
          {backTo && backLabel ? (
            <BackLink to={backTo} label={backLabel} className="ml-auto" />
          ) : (
            <BackLink />
          )}
        </PageActionRow>
        <ExerciseImage
          mediaGif={mediaGif}
          exerciseName={exercise.name}
          className="mt-6"
        />
        <YouTubeExerciseSearchButton exerciseName={exercise.name} />
        <ExerciseSteps steps={exercise.instruction_steps.en} className="mt-8" />
        <PageActionGroup className="mt-6 flex-col sm:flex-row sm:justify-end">
          <Button
            onClick={handleOpenFavouritePicker}
            className={
              isExerciseFavorite?.(exercise.id)
                ? 'rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium'
                : 'rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors dark:bg-slate-800 dark:text-slate-100'
            }
          >
            {isExerciseFavorite?.(exercise.id)
              ? 'Remove Favourite'
              : 'Add to Favourites'}
          </Button>
          <Button onClick={handleCopyUrl} tone={copied ? 'emerald' : 'default'}>
            {copied ? 'Copied!' : 'Copy URL'}
          </Button>
        </PageActionGroup>
      </PageCard>
    </PageLayout>
  )
}
