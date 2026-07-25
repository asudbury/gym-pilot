import { useState, useRef, useEffect, type ReactNode } from 'react'
import { exercises } from '@gym-pilot/shared'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { ExerciseSearchField } from './ExerciseSearchField'
import { ExercisePreview } from './ExercisePreview'
import { useExerciseSearch } from '../../hooks/useExerciseSearch'
import { MIN_SEARCH_CHARS } from '../../constants/home'

type Exercise = (typeof exercises)[number]

type ExercisePickerBaseProps = {
  isOpen: boolean
  onCancel: () => void
  onSelect: (exercise: Exercise) => void
  children: (
    suggestions: Exercise[],
    renderSuggestion: (
      exercise: Exercise,
      customRender: (exercise: Exercise) => ReactNode,
    ) => ReactNode,
  ) => ReactNode
  footer?: ReactNode
  header?: ReactNode
}

export function ExercisePickerBase({
  isOpen,
  onCancel,
  onSelect,
  children,
  footer,
  header,
}: ExercisePickerBaseProps) {
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { searchTerm, setSearchTerm, suggestions } = useExerciseSearch()

  useEffect(() => {
    if (isOpen && !previewExercise) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, previewExercise])

  const handleCancel = () => {
    setSearchTerm('')
    setPreviewExercise(null)
    onCancel()
  }

  const handleSelect = (exercise: Exercise) => {
    setPreviewExercise(null)
    onSelect(exercise)
  }

  const renderSuggestion = (
    exercise: Exercise,
    customRender: (exercise: Exercise) => ReactNode,
  ) => (
    <div
      key={exercise.id}
      className="group flex items-center justify-between border-b border-slate-100 px-4 py-3 text-left"
    >
      <div className="flex-1">{customRender(exercise)}</div>
      <Button
        onClick={() => setPreviewExercise(exercise)}
        tone="default"
      >
        View
      </Button>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      {previewExercise ? (
        <ExercisePreview
          exercise={previewExercise}
          onSelect={handleSelect}
          onClose={() => setPreviewExercise(null)}
        />
      ) : (
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
              onClick={handleCancel}
              className="ml-4 text-sm text-slate-600"
            >
              Cancel
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {header}
            {suggestions.length > 0 ? (
              <div className="flex flex-col">
                {children(suggestions, renderSuggestion)}
              </div>
            ) : (
              <div className="flex h-full items-start justify-center align-text-top mt-4">
                <p className="text-slate-500">
                  {searchTerm.length < MIN_SEARCH_CHARS
                    ? `Enter at least ${MIN_SEARCH_CHARS} characters to search`
                    : 'No exercises found'}
                </p>
              </div>
            )}
          </div>
          {footer}
        </div>
      )}
    </Modal>
  )
}
