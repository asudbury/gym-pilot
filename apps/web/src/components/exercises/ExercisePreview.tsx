import { exercises } from '@gym-pilot/shared'
import { formatLabel } from '../../utils/formatUtils'
import { Button } from '../ui/Button'
import { ExerciseImage } from './ExerciseImage'
import { ExerciseMetaBadges } from './ExerciseMetaBadges'
import { ExerciseSteps } from './ExerciseSteps'
import { DecorativeIcon } from '../ui/DecorativeIcon'

type Exercise = (typeof exercises)[number]

type ExercisePreviewProps = {
  exercise: Exercise
  onSelect: (exercise: Exercise) => void
  onClose: () => void
}

export function ExercisePreview({
  exercise,
  onSelect,
  onClose,
}: ExercisePreviewProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <Button
          type="button"
          onClick={onClose}
          className="text-sm text-slate-600"
        >
          <DecorativeIcon icon="back" className="h-4 w-4" />
          Back to Search
        </Button>
        <Button type="button" onClick={() => onSelect(exercise)} tone="blue">
          Select Exercise
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-2xl font-bold text-slate-800">
          {formatLabel(exercise.name)}
        </h2>
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
        <ExerciseImage
          mediaGif={exercise.gif_url}
          exerciseName={exercise.name}
          className="mt-6"
        />
        <ExerciseSteps steps={exercise.instruction_steps.en} className="mt-8" />
      </div>
    </div>
  )
}
