import { Heading2 } from '../Typography';

type ExerciseResultsHeaderProps = {
  filteredExercisesCount: number
  totalExercises: number
  shouldShowResults: boolean
  searchText: string
  normalizedCategory?: string | null
}

export function ExerciseResultsHeader({
  filteredExercisesCount,
  totalExercises,
  shouldShowResults,
  searchText,
  normalizedCategory,
}: ExerciseResultsHeaderProps) {
  
  return (
    <div className="mb-5 border-b border-slate-200 pb-4">
      <div>
        <Heading2>Exercises</Heading2>
        <p className="text-sm text-slate-600">
          {shouldShowResults && (
            `Showing ${filteredExercisesCount} of ${totalExercises} exercises.`
          )}
        </p>
        {normalizedCategory && (
          <p className="text-sm text-slate-600">
            {normalizedCategory}
          </p>
        )}
        {searchText && (
          <p className="text-sm text-slate-600">
            {searchText}
          </p>
        )}
      </div>
    </div>
  )
}
