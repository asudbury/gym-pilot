import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useRef,
} from 'react'
import { exercises } from '@gym-pilot/shared'
import { formatLabel } from '../../utils/formatUtils'
import { Button } from '../ui/Button'
import { MIN_SEARCH_CHARS } from '../../constants/home'
import { appTokens } from '../../constants/tokens'

type ExerciseSearchFieldProps = {
  id?: string
  label?: string
  value?: string
  placeholder?: string
  className?: string
  onChange?: (value: string) => void
  onClear?: () => void
}

type ExerciseSearchSuggestionsProps = {
  suggestions: (typeof exercises)[number][]
  onSelectExercise?: (exercise: (typeof exercises)[number]) => void
}

type ExerciseSearchPickerProps = {
  id?: string
  label?: string
  value?: string
  placeholder?: string
  className?: string
  onChange?: (value: string) => void
  onSelectExercise?: (exercise: (typeof exercises)[number]) => void
}

export const ExerciseSearchField = forwardRef<
  HTMLInputElement,
  ExerciseSearchFieldProps
>(
  (
    {
      id = 'exercise-search',
      value = '',
      placeholder = 'Try abs, chest, cable...',
      className,
      onChange,
      onClear,
    },
    ref,
  ) => {
    return (
      <div className={className}>
        <div className="relative w-full">
          <input
            ref={ref}
            id={id}
            type="text"
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={placeholder}
            className={`${appTokens.input} h-10 w-full pr-16 text-sm outline-none ring-0 focus:border-slate-400 sm:pr-24`}
          />

          {value && (
            <Button
              type="button"
              onClick={onClear}
              className="absolute inset-y-0 right-2 flex items-center px-2 text-xs text-slate-400 transition hover:text-slate-600 sm:right-3 sm:text-sm"
              aria-label="Clear search"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    )
  },
)

function ExerciseSearchSuggestions({
  suggestions,
  onSelectExercise,
}: ExerciseSearchSuggestionsProps) {
  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Suggestions
      </p>
      <div className="flex flex-col gap-1">
        {suggestions.map((exercise) => (
          <Button
            key={exercise.id}
            type="button"
            onClick={() => onSelectExercise?.(exercise)}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-white hover:text-slate-900"
          >
            <span className="font-medium">{formatLabel(exercise.name)}</span>
            <span className="text-xs text-slate-500">
              {formatLabel(exercise.category)}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}

export function ExerciseSearchPicker({
  id = 'exercise-search',
  value = '',
  placeholder = 'Try abs, chest, cable...',
  className,
  onChange,
  onSelectExercise,
}: ExerciseSearchPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draftValue, setDraftValue] = useState(value)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const deferredValue = useDeferredValue(draftValue)
  const trimmedValue = draftValue.trim()

  useEffect(() => {
    setDraftValue(value)
    if (value === '' && draftValue === '') {
      inputRef.current?.focus()
    }
  }, [value, draftValue])

  const hasSearchThreshold = trimmedValue.length >= MIN_SEARCH_CHARS

  const suggestions = useMemo(() => {
    const normalizedSearch = deferredValue.trim().toLowerCase()

    if (!normalizedSearch || normalizedSearch.length < MIN_SEARCH_CHARS) {
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
      .slice(0, 6)
  }, [deferredValue])

  const handleChange = (nextValue: string) => {
    setDraftValue(nextValue)
    onChange?.(nextValue)
    setShowSuggestions(nextValue.trim().length >= MIN_SEARCH_CHARS)
  }

  const handleClear = () => {
    setDraftValue('')
    setShowSuggestions(false)
    onChange?.('')
  }

  const handleSelectExercise = (exercise: (typeof exercises)[number]) => {
    setShowSuggestions(false)
    onSelectExercise?.(exercise)
  }

  return (
    <div className={className}>
      <ExerciseSearchField
        ref={inputRef}
        id={id}
        value={draftValue}
        placeholder={placeholder}
        onChange={handleChange}
        onClear={handleClear}
      />

      {showSuggestions && suggestions.length > 0 && hasSearchThreshold && (
        <ExerciseSearchSuggestions
          suggestions={suggestions}
          onSelectExercise={handleSelectExercise}
        />
      )}
    </div>
  )
}
