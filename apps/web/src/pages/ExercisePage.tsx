import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { getToneClass } from '../components/toneClasses'
import { ExerciseImage } from '../components/ExerciseImage'
import { ExerciseSteps } from '../components/ExerciseSteps'
import { YouTubeExerciseSearchButton } from '../components/YouTubeExerciseSearchButton'
import { exercises, exercisesSchema } from '@gym-pilot/shared'
import { getExerciseSlug } from '../utils/exerciseRouteUtils'
import { PageCard } from '../components/PageCard'
import { PageActionGroup, PageActionRow } from '../components/PageActionRow'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'
import { ExerciseMetaBadges } from '../components/ExerciseMetaBadges'
import { formatLabel } from '../utils/formatUtils'

type ExercisePageProps = {
  onToggleFavoriteExercise?: (exerciseId: string) => void
  isExerciseFavorite?: (exerciseId: string) => boolean
}

export function ExercisePage({ onToggleFavoriteExercise, isExerciseFavorite }: ExercisePageProps) {
  const { slug } = useParams()
  const [copied, setCopied] = useState(false)

  const exercise = useMemo(() => {
    const parsed = exercisesSchema.parse(exercises)

    if (!slug) {
      return undefined
    }

    return parsed.find((item) => getExerciseSlug(item) === slug || item.id === slug)
  }, [slug])

  const mediaGif = exercise ? exercise.gif_url : ''

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
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
            onClick={() => onToggleFavoriteExercise?.(exercise.id)}
            className={getToneClass(isExerciseFavorite?.(exercise.id) ? 'blue' : 'default', 'cursor-pointer px-4 py-2 text-sm font-medium')}
          >
            {isExerciseFavorite?.(exercise.id) ? 'Added to Favourites' : 'Add to Favourites'}
          </button>
          <Button tone="default" onClick={handleCopyUrl} className="px-4 py-2">
            {copied ? 'Copied!' : 'Copy URL'}
          </Button>
        </PageActionGroup>
      </PageCard>
    </PageLayout>
  )
}
