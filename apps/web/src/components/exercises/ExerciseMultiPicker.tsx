import type { Exercise } from '@gym-pilot/shared';
import { useState } from 'react';
import quickPickExercises from '../../constants/quickPickExercises.json'; // This is fine, it's data
import { formatLabel } from '../../utils/formatUtils';
import { Button } from '../ui/Button';
import { DecorativeIcon } from '../ui/DecorativeIcon';
import { ExercisePickerBase } from './ExercisePickerBase';

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
    onCancel()
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
          <div className="flex flex-col">
            {selectedExercises.length > 0 && (
              <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4">
                {selectedExercises.map((exercise) => (
                  <span
                    key={exercise.id}
                    className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                  >
                    {formatLabel(exercise.name)}
                    <button
                      type="button" 
                      className="flex h-5 w-5 items-center justify-center rounded-full text-blue-500 hover:bg-blue-200 hover:text-blue-700" // Increased tap target area
                      onClick={() => handleToggleExercise(exercise)}
                    >
                      x
                    </button>
                  </span>
                ))}

          <Button
            tone="emerald"
            onClick={handleSelectExercises}
            disabled={selectedExercises.length === 0}
            className="w-full" // Make button full width for better mobile usability
          >
            Add {selectedExercises.length} exercise
            {selectedExercises.length === 1 ? '' : 's'}
          </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4">
            {(quickPickExercises as Exercise[]).map((category) => (
              <Button
                key={category.id}
                tone={
                  selectedExercises.some((e) => e.id === category.id)
                    ? 'blue'
                    : 'default'
                }
                className="px-4 py-2 text-sm" // Increased padding for better tapability on mobile
                onClick={() => handleToggleExercise(category)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      }
      footer={
        <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4">
          <Button
            tone="emerald"
            onClick={handleSelectExercises}
            disabled={selectedExercises.length === 0}
            className="w-full" // Make button full width for better mobile usability
          >
            Add {selectedExercises.length} exercise
            {selectedExercises.length === 1 ? '' : 's'}
          </Button>
        </div>
      }
    >
      {(suggestions, renderSuggestion, triggerPreview) => (
        // Destructure triggerPreview from ExercisePickerBase's children prop
        <>
          {suggestions.map((exercise: Exercise) =>
            // Explicitly type exercise
            renderSuggestion(exercise, (exercise: Exercise) => (
              // customRender now expects 1 arg
              // customRender now expects 1 arg
              <div
                className="flex items-center w-full cursor-pointer" // Entire row is clickable for checkbox
                onClick={() => handleToggleExercise(exercise)} // Toggle checkbox on row click
              >
                {/* Checkbox itself: flex-shrink-0 so it doesn't take extra space */}
                <label
                  className="flex items-center flex-shrink-0 py-1 pr-2" // flex-shrink-0 to keep it compact
                >
                  <input
                    type="checkbox"
                    checked={selectedExercises.some(
                      (e) => e.id === exercise.id,
                    )}
                    onChange={(e) => {
                      e.stopPropagation() // Prevent event from bubbling to the parent div (which also toggles)
                      // The parent div's onClick already handles handleToggleExercise(exercise);
                    }}
                    className="h-5 w-5 cursor-pointer" // Increased size and added cursor
                  />
                </label>

                {/* Exercise name area: This span will contain the icon and name, and trigger preview.
                    It takes flex-1 to occupy the remaining space and is underlined. */}
                <span
                  className="flex-1 cursor-pointer font-medium text-slate-800 hover:text-blue-500 flex items-center py-1 pl-2 ml-2 underline" // Added underline, flex-1
                  onClick={() => triggerPreview(exercise)} // Use triggerPreview here
                >
                  <DecorativeIcon
                    icon="dumbbell"
                    className="mr-2 hidden h-6 w-6 text-slate-400 sm:inline-block"
                  />
                  {formatLabel(exercise.name)}
                </span>
              </div>
            )),
          )}
        </>
      )}
    </ExercisePickerBase>
  )
}
