import type { ReactNode } from 'react'
import { Button } from './Button'
import { ExerciseImage } from './ExerciseImage'
import { ExerciseMetaBadges } from './ExerciseMetaBadges'
import { ExerciseSteps } from './ExerciseSteps'
import { PageActionGroup } from './PageActionRow'
import { PageActionRow } from './PageActionRow'
import { YouTubeExerciseSearchButton } from './YouTubeExerciseSearchButton'
import { Heading2 } from './Typography'
import { appTokens } from '../constants/tokens'
import { formatLabel } from '@gym-pilot/shared'
import type { PlanItem } from '@gym-pilot/types'

type ExerciseDetailsCardProps = {
  exercise: PlanItem
  index?: number
  expanded?: boolean
  onToggle?: (exerciseId: string) => void
  headerActions?: ReactNode
  title?: string
  notesValue?: string
  noteLabel?: string
  notePlaceholder?: string
  noteRows?: number
  onNoteChange?: (exerciseId: string, value: string) => void
  onSaveNote?: (exerciseId: string) => void
  saveButtonLabel?: string
  showNotesSection?: boolean
}

export function ExerciseDetailsCard({
  exercise,
  index,
  expanded = false,
  onToggle,
  headerActions,
  title,
  notesValue,
  noteLabel = 'Notes',
  notePlaceholder = 'Add notes for this exercise',
  noteRows = 3,
  onNoteChange,
  onSaveNote,
  saveButtonLabel = 'Save note',
  showNotesSection = true,
}: ExerciseDetailsCardProps) {
  const headingText = title ?? `${index !== undefined ? `${index + 1}. ` : ''}${formatLabel(exercise.name)}`

  return (
    <>
      <PageActionRow>
        <div>
          <Heading2>{headingText}</Heading2>
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

          {showNotesSection ? (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={`note-${exercise.id}`}>
                {noteLabel}
              </label>
              <textarea
                id={`note-${exercise.id}`}
                value={notesValue ?? exercise.note}
                onChange={(event) => onNoteChange?.(exercise.id, event.target.value)}
                className={`${appTokens.input} w-full`}
                rows={noteRows}
                placeholder={notePlaceholder}
              />
              {onSaveNote ? (
                <Button tone="emerald" onClick={() => onSaveNote(exercise.id)} className="mt-3 px-4 py-2">
                  {saveButtonLabel}
                </Button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </>
  )
}
