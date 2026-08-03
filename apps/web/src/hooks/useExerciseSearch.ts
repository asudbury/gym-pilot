import { useMemo, useDeferredValue, useState } from 'react'
import { exercises } from '@gym-pilot/shared'
import { MIN_SEARCH_CHARS } from '../constants/home'

export function useExerciseSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)

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
      .slice(0, 50)
  }, [deferredSearchTerm])

  return {
    searchTerm,
    setSearchTerm,
    suggestions,
  }
}
