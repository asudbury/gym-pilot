import { useState, useEffect } from 'react'
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

            {dashboardData.workoutTrends &&
              dashboardData.workoutTrends.length > 0 && (
                <WorkoutTrendsChart trends={dashboardData.workoutTrends} />
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Recent Workouts
              </h3>
              {dashboardData.recentWorkouts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {' '}
                  {/* Added type annotation */}
                  {dashboardData.recentWorkouts.map((workout) => (
                    <AppleFitnessWorkoutCard
                      key={workout.id}
                      workout={workout}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">
                  No recent workouts found.
                </p>
              )}
            </div>
          </div>
        )}
      </PageCardLayout>
    </PageLayout>
  )
}
