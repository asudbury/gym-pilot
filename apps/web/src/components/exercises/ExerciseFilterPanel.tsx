import { useState } from 'react'
import { getToneClass } from '../toneClasses'
import { Button } from '../ui/Button'
import { formatLabel } from '../../utils/formatUtils'
import { ExercisePicker } from './ExercisePicker'

type ExerciseFilterPanelProps = {
  draftSearchTerm: string
  selectedCategory: string | null
  categories: string[]
  normalizedCategory: string | null
  showExerciseImages: boolean
  onSearchChange: (value: string) => void
  onSelectExercise: (exerciseName: string) => void
  onCategoryChange: (nextCategory: string | null) => void
  onToggleImages: () => void
}

export function ExerciseFilterPanel({
  selectedCategory,
  categories,
  normalizedCategory,
  showExerciseImages,
  onSelectExercise,
  onCategoryChange,
  onToggleImages,
}: ExerciseFilterPanelProps) {
  const [showExercisePicker, setShowExercisePicker] = useState(false)

  return (
    <div className="space-y-4">
      <div className="mb-5">
        <Button tone="blue" onClick={() => setShowExercisePicker(true)}>
          Pick Exercise
        </Button>
        <ExercisePicker
          onSelectExercise={(exercise) => {
            onSelectExercise(formatLabel(exercise.name))
            setShowExercisePicker(false)
          }}
          isOpen={showExercisePicker}
        />
      </div>

      <div className="mt-4 flex flex-col items-start gap-2">
        <div className="sm:hidden">
          <select
            value={selectedCategory ?? ''}
            onChange={(event) =>
              onCategoryChange(
                event.target.value === ''
                  ? null
                  : event.target.value === 'All'
                    ? 'All'
                    : event.target.value,
              )
            }
            className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
          >
            <option value="">No category selected</option>
            <option value="All">All categories</option>
            {categories
              .filter((category) => category !== 'All')
              .map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
          </select>
        </div>

        <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          {categories.map((category) => {
            const isAll = category === 'All'
            const isSelected = isAll
              ? selectedCategory === 'All'
              : normalizedCategory === category

            return (
              <Button
                key={category}
                onClick={() => onCategoryChange(category)}
                tone={isSelected ? 'blue' : 'default'}
                className={
                  isSelected
                    ? 'px-4 py-2 text-sm font-medium transition'
                    : 'px-4 py-2 text-sm font-medium transition hover:bg-slate-200'
                }
              >
                {category}
              </Button>
            )
          })}
        </div>
        <Button
          onClick={onToggleImages}
          className={
            showExerciseImages
              ? getToneClass(
                  'default',
                  'w-fit px-4 py-2 text-sm font-medium transition hover:bg-slate-200',
                )
              : getToneClass(
                  'blue',
                  'w-fit px-4 py-2 text-sm font-medium transition',
                )
          }
        >
          {showExerciseImages ? 'Hide images' : 'Show images'}
        </Button>
      </div>
    </div>
  )
}
