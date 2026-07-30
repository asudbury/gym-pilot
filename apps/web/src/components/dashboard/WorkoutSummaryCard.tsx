import React from 'react'
import { Button } from '../ui/Button'
import { DecorativeIcon } from '../ui/DecorativeIcon'
import { StatusMessageNotification } from '../ui/StatusMessageNotification'

type WorkoutSummary = {
  totalWorkouts: number
  totalCalories: number
  averageDuration: number
}

type WorkoutSummaryCardProps = {
  workoutSummary: WorkoutSummary | null
  handleShareSummary: () => Promise<void>
  isSharing: boolean
  shareStatus: { message: string; tone: 'success' | 'error' } | null
}

export const WorkoutSummaryCard: React.FC<WorkoutSummaryCardProps> = ({
  workoutSummary,
  handleShareSummary,
  isSharing,
  shareStatus,
}) => {
  if (!workoutSummary || workoutSummary.totalWorkouts === 0) {
    return null
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-800 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Workout Summary
        </h3>
        <Button
          onClick={handleShareSummary}
          tone="default"
          isLoading={isSharing}
          loadingLabel="Sharing..."
        >
          <DecorativeIcon icon="share" className="h-4 w-4" /> Share
        </Button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center rounded-md bg-blue-50 p-3 dark:bg-blue-900">
          <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">
            {workoutSummary.totalWorkouts}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            Total Workouts
          </p>
        </div>
        <div className="flex flex-col items-center rounded-md bg-emerald-50 p-3 dark:bg-emerald-900">
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
            {workoutSummary.totalCalories.toFixed(0)} kcal
          </p>
          <p className="text-sm text-emerald-600 dark:text-emerald-300">
            Total Calories Burned
          </p>
        </div>
        <div className="flex flex-col items-center rounded-md bg-orange-50 p-3 dark:bg-orange-900">
          <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
            {workoutSummary.averageDuration.toFixed(1)} min
          </p>
          <p className="text-sm text-orange-600 dark:text-orange-300">
            Avg. Duration
          </p>
        </div>
      </div>
      {shareStatus && (
        <StatusMessageNotification
          message={shareStatus.message}
          tone={shareStatus.tone}
        />
      )}
    </div>
  )
}
