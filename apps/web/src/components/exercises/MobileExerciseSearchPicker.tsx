import { useDeferredValue, useMemo, useState, useRef, useEffect } from 'react'
import { exercises } from '@gym-pilot/shared'
import { formatLabel } from '../../utils/formatUtils'
import { Button } from '../ui/Button'
import { MIN_SEARCH_CHARS } from '../../constants/home'
import { Modal } from '../ui/Modal'
import { ExerciseSearchField } from './ExerciseSearchPicker'
import { DecorativeIcon } from '../ui/DecorativeIcon'
import { getToneClass } from '../toneClasses'

type Exercise = (typeof exercises)[number]

type MobileExerciseSearchPickerProps = {
  onSelectExercise: (exercise: Exercise) => void
}

export function MobileExerciseSearchPicker({
  onSelectExercise,
}: MobileExerciseSearchPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const deferredSearchTerm = useDeferredValue(searchTerm)

  useEffect(() => {
    if (isOpen) {
      // Focus the input when the modal opens
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const suggestions = useMemo(() => {
    const normalizedSearch = deferredSearchTerm.trim().toLowerCase()

    if (normalizedSearch.length < MIN_SEARCH_CHARS) {
      return []
    }

    return exercises
      .filter((exercise) => {
        const searchableText = [
          exercise.name,
          exercise.category,
          exercise.target,
          exercise.equipment,
        ]
          .join(' ')
          .toLowerCase()
        return searchableText.includes(normalizedSearch)
      })
      .slice(0, 50) // Show more results for mobile
  }, [deferredSearchTerm])

  const handleSelectExercise = (exercise: Exercise) => {
    setIsOpen(false)
    setSearchTerm('')
    onSelectExercise(exercise)
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className={getToneClass('blue')}>
        Search for Exercise
      </Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="flex h-full flex-col">
          <div className="flex items-center border-b border-slate-200 p-4">
            <div className="flex-1">
              <ExerciseSearchField
                ref={inputRef}
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={() => setSearchTerm('')}
              />
            </div>
            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              className="ml-4 text-sm text-slate-600"
            >
              Cancel
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {suggestions.length > 0 ? (
              <div className="flex flex-col">
                {suggestions.map((exercise, index) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => handleSelectExercise(exercise)}
                    className={`group border-b border-slate-100 px-4 py-3 text-left ${
                      index % 2 === 1 ? 'bg-slate-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <DecorativeIcon
                        icon="dumbbell"
                        className="mr-2 inline-block h-4 w-4 text-slate-400"
                      />
                      <span className="font-medium text-slate-800 group-hover:font-semibold">
                        {formatLabel(exercise.name)} - (
                        {formatLabel(exercise.category)})
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center">
                <p className="text-slate-500">
                  {searchTerm.length < MIN_SEARCH_CHARS
                    ? `Enter at least ${MIN_SEARCH_CHARS} characters to search`
                    : 'No exercises found'}
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
