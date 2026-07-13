import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { ExerciseImage } from '../components/ExerciseImage'
import { ExerciseMetaBadges } from '../components/ExerciseMetaBadges'
import { ExerciseSteps } from '../components/ExerciseSteps'
import { YouTubeExerciseSearchButton } from '../components/YouTubeExerciseSearchButton'
import { formatLabel } from '@gym-pilot/shared'
import { exercises, exercisesSchema } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { PageActionGroup, PageActionRow } from '../components/PageActionRow'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'

export function ExercisePage() {
  const { id } = useParams()
  const [copied, setCopied] = useState(false)

  const exercise = useMemo(() => {
    const parsed = exercisesSchema.parse(exercises)
    return parsed.find((item) => item.id === id)
  }, [id])

  const mediaGif = exercise ? `/${exercise.gif_url}` : ''

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
        <PageActionRow>
          <Heading1 className="mt-3">{formatLabel(exercise.name)}</Heading1>
          <PageActionGroup className="justify-end">
            <Button tone="default" onClick={handleCopyUrl} className="px-4 py-2">
              {copied ? 'Copied!' : 'Copy URL'}
            </Button>
          </PageActionGroup>
        </PageActionRow>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ExerciseMetaBadges
            values={[formatLabel(exercise.body_part), formatLabel(exercise.equipment), formatLabel(exercise.target)]}
            tones={['blue', 'orange', 'default']}
          />
        </div>

        <ExerciseImage mediaGif={mediaGif} exerciseName={exercise.name} className="mt-6" />
        <YouTubeExerciseSearchButton exerciseName={exercise.name} />
        <ExerciseSteps steps={exercise.instruction_steps.en} className="mt-8" />
      </PageCard>
    </PageLayout>
  )
}
