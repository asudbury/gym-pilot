import React, { useState, useMemo } from 'react'
import { AppleFitnessWorkoutCard } from '../../components/AppleFitnessWorkoutCard'
import { Button } from '../ui/Button'
import type { Workout } from '../../types/healthData'

type RecentWorkoutsSectionProps = {
  initialWorkouts: Workout[]
  onWorkoutCardClick: (workout: Workout) => void
}

export const RecentWorkoutsSection: React.FC<RecentWorkoutsSectionProps> = ({
  initialWorkouts,
  onWorkoutCardClick,
}) => {
  const [sortOption, setSortOption] = useState<string>('date_desc')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all')
  const [customStartDate, setCustomStartDate] = useState<string | null>(null)
  const [customEndDate, setCustomEndDate] = useState<string | null>(null)
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string>('All')

  // Derive unique workout types for the filter dropdown
  const uniqueWorkoutTypes = useMemo(() => {
    const types = new Set<string>()
    initialWorkouts.forEach((workout) => types.add(workout.type))
    return ['All', ...Array.from(types).sort()]
  }, [initialWorkouts])

  // Filter workouts based on selected type and date range
  const filteredWorkouts = useMemo(() => {
    let workouts = initialWorkouts

    // Apply workout type filter
    if (selectedWorkoutType !== 'All') {
      workouts = workouts.filter(
        (workout) => workout.type === selectedWorkoutType,
      )
    }

    // Apply date range filter
    const now = new Date()
    let startDate: Date | null = null
    let endDate: Date | null = null

    if (selectedDateRange === 'last7days') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0) // Start of the day
    } else if (selectedDateRange === 'last31days') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 31)
      startDate.setHours(0, 0, 0, 0) // Start of the day
    } else if (
      selectedDateRange === 'custom' &&
      customStartDate &&
      customEndDate
    ) {
      startDate = new Date(customStartDate)
      endDate = new Date(customEndDate)
      if (endDate) {
        endDate.setHours(23, 59, 59, 999) // End of the day
      }
    }

    if (startDate) {
      workouts = workouts.filter((workout) => {
        const workoutDate = new Date(workout.start_date)
        return workoutDate >= startDate! && (!endDate || workoutDate <= endDate)
      })
    }

    return workouts
  }, [
    initialWorkouts,
    selectedWorkoutType,
    selectedDateRange,
    customStartDate,
    customEndDate,
  ])

  // Sort filtered workouts based on selected sort option
  const sortedWorkouts = useMemo(() => {
    const workoutsToSort = [...filteredWorkouts] // Create a shallow copy to avoid mutating state

    switch (sortOption) {
      case 'date_desc':
        return workoutsToSort.sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
        )
      case 'date_asc':
        return workoutsToSort.sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
        )
      case 'duration_desc':
        return workoutsToSort.sort((a, b) => b.duration - a.duration)
      case 'duration_asc':
        return workoutsToSort.sort((a, b) => a.duration - b.duration)
      case 'calories_desc':
        return workoutsToSort.sort((a, b) => b.energy - a.energy)
      case 'calories_asc':
        return workoutsToSort.sort((a, b) => a.energy - b.energy)
      default:
        return workoutsToSort.sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
        ) // Default to date_desc
    }
  }, [filteredWorkouts, sortOption])

  // Define sort options for the dropdown
  const sortOptions = [
    { value: 'date_desc', label: 'Date (Newest First)' },
    { value: 'date_asc', label: 'Date (Oldest First)' },
    { value: 'duration_desc', label: 'Duration (Longest First)' },
    { value: 'duration_asc', label: 'Duration (Shortest First)' },
    { value: 'calories_desc', label: 'Calories (Highest First)' },
    { value: 'calories_asc', label: 'Calories (Lowest First)' },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Apple Fitness
      </h3>

      <div className="flex flex-col gap-4">
        {/* Date Range Pills */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Date Range:
          </label>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setSelectedDateRange('all')
                setCustomStartDate(null)
                setCustomEndDate(null)
              }}
              tone={selectedDateRange === 'all' ? 'blue' : 'default'}
              className="px-3 py-1.5 text-sm"
            >
              All
            </Button>
            <Button
              onClick={() => {
                setSelectedDateRange('last7days')
                setCustomStartDate(null)
                setCustomEndDate(null)
              }}
              tone={selectedDateRange === 'last7days' ? 'blue' : 'default'}
              className="px-3 py-1.5 text-sm"
            >
              Last 7 Days
            </Button>
            <Button
              onClick={() => {
                setSelectedDateRange('last31days')
                setCustomStartDate(null)
                setCustomEndDate(null)
              }}
              tone={selectedDateRange === 'last31days' ? 'blue' : 'default'}
              className="px-3 py-1.5 text-sm"
            >
              Last 31 Days
            </Button>
            <Button
              onClick={() => setSelectedDateRange('custom')}
              tone={selectedDateRange === 'custom' ? 'blue' : 'default'}
              className="px-3 py-1.5 text-sm"
            >
              Custom Range
            </Button>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {selectedDateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label
                htmlFor="custom-start-date"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                From:
              </label>
              <input
                type="date"
                id="custom-start-date"
                value={customStartDate || ''}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="custom-end-date"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                To:
              </label>
              <input
                type="date"
                id="custom-end-date"
                value={customEndDate || ''}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          {/* Workout Type Filter */}
          {uniqueWorkoutTypes.length > 1 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="workout-type-filter"
                className="sr-only text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Filter by type:
              </label>
              <select
                id="workout-type-filter"
                value={selectedWorkoutType}
                onChange={(e) => setSelectedWorkoutType(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {uniqueWorkoutTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Option */}
          {sortedWorkouts.length > 0 && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="workout-sort-option"
                className="sr-only text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Sort by:
              </label>
              <select
                id="workout-sort-option"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {sortedWorkouts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedWorkouts.map((workout) => (
            <AppleFitnessWorkoutCard
              key={workout.id}
              workout={workout}
              onClick={onWorkoutCardClick}
            />
          ))}
        </div>
      ) : (
        <p className="text-slate-500 dark:text-slate-400">
          No workouts found matching your criteria.
        </p>
      )}
    </div>
  )
}
