import type { Exercise } from '@gym-pilot/shared';
import { formatLabel } from '../../utils/formatUtils';
import { DecorativeIcon } from '../ui/DecorativeIcon';
import { ExercisePickerBase } from './ExercisePickerBase';

export interface ExercisePickerProps {
  isOpen: boolean
  onSelectExercise: (exercise: Exercise) => void
}

export function ExercisePicker({
  onSelectExercise,
  isOpen,
  ...rest
}: ExercisePickerProps) {
  const handleSelect = (exercise: Exercise) => onSelectExercise(exercise)

  return (
    <ExercisePickerBase
      onCancel={() => {}}
      onSelect={handleSelect}
      isOpen={isOpen}
      {...rest}
    >
      {(suggestions, renderSuggestion, _triggerPreview) => (
        <>
          {suggestions.map((exercise: Exercise) =>
            renderSuggestion(exercise, (exercise: Exercise) => (
              <button
                type="button"
                onClick={() => handleSelect(exercise)}
                className="flex-1"
              >
                <div className="flex items-center gap-2">
                  <DecorativeIcon
                    icon="dumbbell"
                    className="ml-2 mr-2 inline-block h-6 w-6 text-slate-400"
                  />
                  <span className="font-medium text-slate-800 group-hover:text-blue-500">
                    {formatLabel(exercise.name)}
                  </span>
                </div>
              </button>
            )),
          )}
        </>
      )}
    </ExercisePickerBase>
  )
}
