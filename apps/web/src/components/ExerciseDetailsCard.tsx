import type { ReactNode } from 'react'
import { Button } from './Button'
import { ExerciseImage } from './ExerciseImage'
import { ExerciseMetaBadges } from './ExerciseMetaBadges'
import { ExerciseSteps } from './ExerciseSteps'
import { PageActionGroup } from './PageActionRow'
import { PageActionRow } from './PageActionRow'
import { YouTubeExerciseSearchButton } from './YouTubeExerciseSearchButton'
import { Heading2 } from './Typography'
import type { PlanItem } from '@gym-pilot/types'
import { formatLabel } from '../utils/formatUtils'

type ExerciseDetailsCardProps = {
  exercise: PlanItem
  index?: number
  expanded?: boolean
  onToggle?: (exerciseId: string) => void
  headerActions?: ReactNode
  title?: string
  saveButtonLabel?: string
}

export function ExerciseDetailsCard({
  exercise,
  index,
  expanded = false,
  onToggle,
  headerActions,
  title,
}: ExerciseDetailsCardProps) {
  const headingText = title ?? `${index !== undefined ? `${index + 1}. ` : ''}${formatLabel(exercise.name)}`

  return (
    <>
      <PageActionRow>
        <div>
          <Heading2>{formatLabel(headingText)}</Heading2>
        </div>
        <PageActionGroup>
          {onToggle ? (
            <Button tone="white" onClick={() => onToggle(exercise.id)} className="px-3 py-2">
              {expanded ? 'Hide details' : 'Show details'}
            </Button>
          ) : null}
          {headerActions}
        </PageActionGroup>
      </PageActionRow>

      <ExerciseMetaBadges
        values={[
          formatLabel(exercise.body_part),
          formatLabel(exercise.equipment),
          formatLabel(exercise.target),
        ]}
        tones={['blue', 'orange', 'default']}
        className="mt-4"
      />

      {expanded ? (
        <>
          <ExerciseImage mediaGif={exercise.gif_url} exerciseName={exercise.name} className="mt-6" />
          <ExerciseSteps steps={exercise.instruction_steps.en} className="mt-8" />
          <YouTubeExerciseSearchButton exerciseName={exercise.name} />
        </>
      ) : null}
    </>
  )
}
