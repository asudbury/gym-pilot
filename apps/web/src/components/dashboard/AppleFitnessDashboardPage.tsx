import { useState, useEffect, useMemo } from 'react'
import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { AppleFitnessWorkoutCard } from '../../components/AppleFitnessWorkoutCard'
import { ActivityRingsDisplay } from './ActivityRingsDisplay'
import type {
  ActivityRingData,
  AppleFitnessDashboardData,
  Workout,
  WorkoutTrend, // New import
} from '../../types/healthData' // Corrected import type
import { WorkoutTrendsChart } from '../../types/WorkoutTrendsChart'

export function AppleFitnessDashboardPage() {
  const [dashboardData, setDashboardData] =
    useState<AppleFitnessDashboardData | null>(null)
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string>('All') // New state for filter
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simulate fetching data from an API or local storage
    const fetchAppleFitnessData = async () => {
      setLoading(true)
      setError(null)
      try {
        // In a real application, you would fetch this data from your backend
        // which would have processed the HealthKit export.
        const mockActivityRings: ActivityRingData = {
          moveGoal: 600, // kcal
          moveProgress: 450, // kcal
          exerciseGoal: 30, // minutes
          exerciseProgress: 25, // minutes
          standGoal: 12, // hours
          standProgress: 8, // hours
        }

        const mockWorkouts: Workout[] = [
          {
            id: 'workout-1',
            display_name: 'Outdoor Run',
            energy: 350,
            energy_unit: 'kcal',
            start_date: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 2 days ago
            end_date: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000 + 2700 * 1000,
            ).toISOString(),
            source: {
              name: 'Apple Watch',
              bundle_identifier: 'com.apple.Health',
            },
            duration: 2700, // 45 minutes
            type: 'Running',
          },
          {
            id: 'workout-2',
            display_name: 'Strength Training',
            energy: 280,
            energy_unit: 'kcal',
            start_date: new Date(
              Date.now() - 5 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 5 days ago
            end_date: new Date(
              Date.now() - 5 * 24 * 60 * 60 * 1000 + 3600 * 1000,
            ).toISOString(),
            source: {
              name: 'Apple Health',
              bundle_identifier: 'com.apple.Health',
            },
            duration: 3600, // 60 minutes
            type: 'Strength Training',
          },
          {
            id: 'workout-3',
            display_name: 'HIIT',
            energy: 400,
            energy_unit: 'kcal',
            start_date: new Date(
              Date.now() - 1 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 1 day ago
            end_date: new Date(
              Date.now() - 1 * 24 * 60 * 60 * 1000 + 1800 * 1000,
            ).toISOString(),
            source: {
              name: 'Apple Watch',
              bundle_identifier: 'com.apple.Health',
            }, // Changed ID
            duration: 1800, // 30 minutes
            type: 'High Intensity Interval Training',
          },
          {
            id: 'workout-3',
            display_name: 'HIIT',
            energy: 400, // Changed display name
            energy_unit: 'kcal',
            start_date: new Date(
              Date.now() - 1 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 1 day ago
            end_date: new Date(
              Date.now() - 1 * 24 * 60 * 60 * 1000 + 1800 * 1000,
            ).toISOString(),
            source: {
              name: 'Apple Watch',
              bundle_identifier: 'com.apple.Health',
            }, // Changed type
            duration: 1800, // 30 minutes
            type: 'High Intensity Interval Training',
          },
          {
            id: 'workout-4', // Changed ID
            display_name: 'Yoga', // Changed display name
            energy: 150,
            energy_unit: 'kcal',
            start_date: new Date(
              Date.now() - 3 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 3 days ago
            end_date: new Date(
              Date.now() - 3 * 24 * 60 * 60 * 1000 + 2400 * 1000,
            ).toISOString(),
            source: {
              name: 'Apple Watch',
              bundle_identifier: 'com.apple.Health',
            }, // Corrected import type
            duration: 1800, // 30 minutes
            type: 'High Intensity Interval Training',
          },
        ]
        const mockWorkoutTrends: WorkoutTrend[] = [
          {
            id: 'total_calories_weekly',
            name: 'Total Calories Burned (Weekly)',
            unit: 'kcal',
            data: [
              { date: '2023-W48', value: 1500 },
              { date: '2023-W49', value: 1800 },
              { date: '2023-W50', value: 2100 },
              { date: '2023-W51', value: 1950 },
              { date: '2023-W52', value: 2300 },
            ],
          },
          {
            id: 'avg_duration_weekly',
            name: 'Average Workout Duration (Weekly)',
            unit: 'minutes',
            data: [
              { date: '2023-W48', value: 35 },
              { date: '2023-W49', value: 40 },
              { date: '2023-W50', value: 42 },
              { date: '2023-W51', value: 38 },
              { date: '2023-W52', value: 45 },
            ],
          },
        ]

        await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay

        setDashboardData({
          activityRings: mockActivityRings,
          recentWorkouts: mockWorkouts,
          workoutTrends: mockWorkoutTrends, // Add trends here
        })
      } catch (err) {
        setError('Failed to load Apple Fitness data.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    void fetchAppleFitnessData()
  }, [])

  // Calculate workout summary statistics
  const workoutSummary = dashboardData?.recentWorkouts
    ? {
        totalWorkouts: dashboardData.recentWorkouts.length,
        totalCalories: dashboardData.recentWorkouts.reduce(
          (sum, workout) => sum + workout.energy,
          0,
        ),
        averageDuration:
          dashboardData.recentWorkouts.length > 0
            ? dashboardData.recentWorkouts.reduce(
                (sum, workout) => sum + workout.duration,
                0,
              ) / dashboardData.recentWorkouts.length / 60 // Convert seconds to minutes
            : 0,
      }
    : null

  // Derive unique workout types for the filter dropdown
  const uniqueWorkoutTypes = useMemo(() => {
    if (!dashboardData?.recentWorkouts) return []
    const types = new Set<string>()
    dashboardData.recentWorkouts.forEach((workout) => types.add(workout.type))
    return ['All', ...Array.from(types).sort()]
  }, [dashboardData?.recentWorkouts])

  // Filter workouts based on selected type
  const filteredWorkouts = useMemo(() => {
    if (!dashboardData?.recentWorkouts) return []
    if (selectedWorkoutType === 'All') {
      return dashboardData.recentWorkouts
    }
    return dashboardData.recentWorkouts.filter(
      (workout) => workout.type === selectedWorkoutType,
    )
  }, [dashboardData?.recentWorkouts, selectedWorkoutType])


  return (
    <PageLayout className="max-w-6xl">
      <PageCardLayout
        title="Apple Fitness Dashboard"
        subtitle="Your Health & Activity Summary"
        description="View your activity rings, workout history, and health trends."
        icon="heart"
      >
        {loading && <p>Loading your Apple Fitness data...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {dashboardData && (
          <div className="space-y-6">
            {dashboardData.activityRings && (
              <ActivityRingsDisplay data={dashboardData.activityRings} />
            )}

            {workoutSummary && workoutSummary.totalWorkouts > 0 && (
              <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-800">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Workout Summary
                </h3>
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
              </div>
            )}

            {dashboardData.workoutTrends &&
              dashboardData.workoutTrends.length > 0 && (
                <WorkoutTrendsChart trends={dashboardData.workoutTrends} />
              )}

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Recent Workouts
              </h3>
              {/* Workout Type Filter */}
              {uniqueWorkoutTypes.length > 1 && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="workout-type-filter"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
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

              {filteredWorkouts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWorkouts.map((workout) => (
                    <AppleFitnessWorkoutCard
                      key={workout.id}
                      workout={workout}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">
                  No workouts found for the selected type.
                </p>
              )}
            </div>
          </div>
        )}
      </PageCardLayout>
    </PageLayout>
  )
}
