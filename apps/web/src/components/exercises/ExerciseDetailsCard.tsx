import type { ReactNode } from 'react'
import { Button } from '../Button'
import { ExerciseImage } from './ExerciseImage'
import { ExerciseMetaBadges } from './ExerciseMetaBadges'
import { ExerciseSteps } from './ExerciseSteps'
import { PageActionGroup } from '../PageActionRow'
import { PageActionRow } from '../PageActionRow'
import { YouTubeExerciseSearchButton } from './YouTubeExerciseSearchButton'
import { Heading2 } from '../Typography'
import type { Exercise } from '@gym-pilot/shared'
import { formatLabel } from '../../utils/formatUtils'

type ExerciseDetailsCardProps = {
  exercise: Exercise
  expanded?: boolean
  onToggle?: (exerciseId: string) => void
  headerActions?: ReactNode
  title?: string
  saveButtonLabel?: string
}

function isExerciseDetailsExercise(value: Exercise): value is Exercise {
  return 'body_part' in value && 'equipment' in value && 'target' in value && 'gif_url' in value
}

export function ExerciseDetailsCard({
  exercise,
  expanded = false,
  onToggle,
  headerActions,
}: ExerciseDetailsCardProps) {

  const exerciseDetails = isExerciseDetailsExercise(exercise) ? exercise : undefined

  if (!exerciseDetails) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">Exercise details are not available.</p>
      </div>
    )
  }

  return (
    <>
      <PageActionRow>
        <div>
          <Heading2>{formatLabel(exerciseDetails?.name)}</Heading2>
        </div>
        <PageActionGroup>
          {onToggle ? (
            <Button tone="default" onClick={() => onToggle(exercise.id)} className="px-3 py-2">
              {expanded ? 'Hide details' : 'Show details'}
            </Button>
          ) : null}
          {headerActions}
        </PageActionGroup>
      </PageActionRow>

      {exerciseDetails ? (
        <ExerciseMetaBadges
          values={[
            formatLabel(exerciseDetails.body_part),
            formatLabel(exerciseDetails.equipment),
            formatLabel(exerciseDetails.target),
          ]}
          tones={['blue', 'orange', 'default']}
          className="mt-4"
        />
      ) : null}

      {expanded && exerciseDetails ? (
        <>
          <ExerciseImage mediaGif={exerciseDetails.gif_url} exerciseName={exerciseDetails.name} className="mt-6" />
          <ExerciseSteps steps={exerciseDetails.instruction_steps.en} className="mt-8" />
          <YouTubeExerciseSearchButton exerciseName={exerciseDetails.name} />
        </>
      ) : null}
    </>
  )
}
