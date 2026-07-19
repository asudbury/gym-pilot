import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { exercises } from '@gym-pilot/shared'
import { formatLabel } from '../../utils/formatUtils'
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

export function ExerciseSearchField({
  id = 'exercise-search',
  label = 'Search exercises',
  value = '',
  placeholder = 'Try abs, chest, cable...',
  className,
  onChange,
  onClear,
}: ExerciseSearchFieldProps) {
  return (
    <div className={className}>
      <label
        className="mb-2 block text-sm font-medium text-slate-700"
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative w-full">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          className={`${appTokens.input} pr-20 outline-none ring-0 focus:border-slate-400 sm:pr-24`}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-slate-600"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export function ExerciseSearchSuggestions({
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
          <button
            key={exercise.id}
            type="button"
            onClick={() => onSelectExercise?.(exercise)}
            className="flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-white hover:text-slate-900"
          >
            <span className="font-medium">{formatLabel(exercise.name)}</span>
            <span className="text-xs text-slate-500">
              {formatLabel(exercise.category)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function ExerciseSearchPicker({
  id = 'exercise-search',
  label = 'Search exercises',
  value = '',
  placeholder = 'Try abs, chest, cable...',
  className,
  onChange,
  onSelectExercise,
}: ExerciseSearchPickerProps) {
  const [draftValue, setDraftValue] = useState(value)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const deferredValue = useDeferredValue(draftValue)
  const trimmedValue = draftValue.trim()

  useEffect(() => {
    setDraftValue(value)
  }, [value])

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
    const nextValue = formatLabel(exercise.name)
    setDraftValue(nextValue)
    setShowSuggestions(false)
    onChange?.(nextValue)
    onSelectExercise?.(exercise)
  }

  return (
    <div className={className}>
      <ExerciseSearchField
        id={id}
        label={label}
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
