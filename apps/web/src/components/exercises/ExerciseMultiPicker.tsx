import { useState } from 'react'
import { exercises } from '@gym-pilot/shared'
import { formatLabel } from '../../utils/formatUtils'
import { Button } from '../ui/Button'
import { DecorativeIcon } from '../ui/DecorativeIcon'
import { ExercisePickerBase } from './ExercisePickerBase'
import quickPickExercises from '../../constants/quickPickExercises.json'

type Exercise = (typeof exercises)[number]

type ExerciseSearchMultiPickerProps = {
  isOpen: boolean
  onSelectExercises: (exercises: Exercise[]) => void
  onCancel: () => void
}

export function ExerciseMultiPicker({
  isOpen,
  onSelectExercises,
  onCancel,
}: ExerciseSearchMultiPickerProps) {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])

  const handleToggleExercise = (exercise: Exercise) => {
    setSelectedExercises((prev) =>
      prev.some((e) => e.id === exercise.id)
        ? prev.filter((e) => e.id !== exercise.id)
        : [...prev, exercise],
    )
  }

  const handleSelectExercises = () => {
    onSelectExercises(selectedExercises)
    setSelectedExercises([])
    // onCancel is called by ExercisePickerBase, no need to call it here.
  }

  const handleCancel = () => {
    setSelectedExercises([])
    onCancel()
  }

  return (
    <ExercisePickerBase
      isOpen={isOpen}
      onCancel={handleCancel}
      onSelect={handleToggleExercise}
      header={
        <>
          <div className="flex flex-wrap gap-2 p-4 border-b border-slate-200">
            {(quickPickExercises as Exercise[]).map((category) => (
              <Button
                key={category.id}
                type="button"
                tone={
                  selectedExercises.some((e) => e.id === category.id)
                    ? 'blue'
                    : 'default'
                }
                className="px-3 py-1 text-sm"
                onClick={() => handleToggleExercise(category)}
              >
                {category.name}
              </Button>
            ))}
          </div>
          {selectedExercises.length > 0 && (
            <div className="flex flex-wrap gap-2 p-4 border-b border-slate-200">
              <span className="text-sm font-medium text-slate-500">
                Selected:
              </span>
              {selectedExercises.map((exercise) => (
                <span
                  key={exercise.id}
                  className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                >
                  {formatLabel(exercise.name)}
                  <button
                    type="button"
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => handleToggleExercise(exercise)}
                  >
                    <DecorativeIcon icon="dumbbell" className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </>
      }
      footer={
        <div className="p-4 border-t border-slate-200">
          <Button
            type="button"
            tone="blue"
            onClick={handleSelectExercises}
            disabled={selectedExercises.length === 0}
          >
            Add {selectedExercises.length} exercise
            {selectedExercises.length === 1 ? '' : 's'}
          </Button>
        </div>
      }
    >
      {(suggestions, renderSuggestion) => (
        <>
          {suggestions.map((exercise) =>
            renderSuggestion(exercise, (exercise) => (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedExercises.some((e) => e.id === exercise.id)}
                  onChange={() => handleToggleExercise(exercise)}
                />
                <DecorativeIcon
                  icon="dumbbell"
                  className="ml-2 mr-2 inline-block h-6 w-6 text-slate-400"
                />
                <span className="font-medium text-slate-800 group-hover:text-blue-500">
                  {formatLabel(exercise.name)}
                </span>
              </label>
            )),
          )}
        </>
      )}
    </ExercisePickerBase>
  )
}
