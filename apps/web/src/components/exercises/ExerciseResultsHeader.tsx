import { appTokens } from '../../constants/tokens'
import { Heading2 } from '../Typography'
import { MIN_SEARCH_CHARS } from '../../constants/home'

type ExerciseResultsHeaderProps = {
  filteredExercisesCount: number
  totalExercises: number
  shouldShowResults: boolean
  hasSearchText: boolean
  hasSearchThreshold: boolean
  normalizedCategory: string | null
}

export function ExerciseResultsHeader({
  filteredExercisesCount,
  totalExercises,
  shouldShowResults,
  hasSearchText,
  hasSearchThreshold,
  normalizedCategory,
}: ExerciseResultsHeaderProps) {
  return (
    <div className="mb-5 border-b border-slate-200 pb-4">
      <div>
        <Heading2>Exercises</Heading2>
        <p className="text-sm text-slate-600">
          {shouldShowResults
            ? `Showing ${filteredExercisesCount} of ${totalExercises} exercises.`
            : hasSearchText && !hasSearchThreshold
              ? `Type at least ${MIN_SEARCH_CHARS} characters to search.`
              : 'Start typing or choose a category to reveal exercises.'}
        </p>
      </div>
    </div>
  )
}
