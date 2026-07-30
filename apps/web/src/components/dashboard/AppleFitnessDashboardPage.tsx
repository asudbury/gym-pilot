import { useState, useEffect, useMemo } from 'react'
import { PageLayout } from '../../layouts/PageLayout'
import { ActivityRingsDisplay } from './ActivityRingsDisplay'
import type {
  ActivityRingData,
  WorkoutTrend,
  Workout, // Corrected import type
  AppleFitnessDashboardData,
} from '../../types/healthData'
import { WorkoutTrendsChart } from './WorkoutTrendsChart' // Corrected import path
import { WorkoutSummaryCard } from './WorkoutSummaryCard'
import { RecentWorkoutsSection } from './RecentWorkoutsSection'
import { WorkoutDetailsModal } from './WorkoutDetailsModal'

export function AppleFitnessDashboardPage() {
  const [dashboardData, setDashboardData] =
    useState<AppleFitnessDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedWorkoutForDetails, setSelectedWorkoutForDetails] =
    useState<Workout | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [shareStatus, setShareStatus] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  useEffect(() => {
    // Simulate fetching data from an API or local storage
    const fetchAppleFitnessData = async () => {
      setLoading(true)
      setError(null)
      try {
        // In a real application, you would fetch this data from your backend
        // which would have processed the HealthKit export.
        const mockActivityRings: ActivityRingData = {
          moveGoal: 600, // kcal // Corrected import type
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
            id: 'workout-3-hiit-1', // Changed ID to be unique
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
            // This was a duplicate entry, let's make it unique and slightly different
            id: 'workout-3-hiit-2', // Changed ID to be unique
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
            // This was also a duplicate ID, let's make it unique
            id: 'workout-4-yoga', // Changed ID to be unique
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
              // Corrected import type
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
            name: 'Total Calories Burned',
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
            name: 'Average Workout Duration',
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

  const handleShareSummary = async () => {
    if (!workoutSummary) return
    setIsSharing(true)
    setShareStatus(null)
    const summaryText = `
My Apple Fitness Workout Summary:
🏋️ Total Workouts: ${workoutSummary.totalWorkouts}
🔥 Total Calories Burned: ${workoutSummary.totalCalories.toFixed(0)} kcal
⏱️ Average Workout Duration: ${workoutSummary.averageDuration.toFixed(1)} min
Check out Gym-Pilot for more!
    `.trim()
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Apple Fitness Workout Summary',
          text: summaryText,
        })
        setShareStatus({
          message: 'Workout summary shared successfully!',
          tone: 'success',
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          // User cancelled share
          setShareStatus({
            message: 'Failed to share workout summary.',
            tone: 'error',
          }) // Corrected import type
          console.error('Web Share API failed:', err)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(summaryText)
        setShareStatus({
          message: 'Workout summary copied to clipboard!',
          tone: 'success',
        })
      } catch (err) {
        // Corrected import type
        setShareStatus({
          message: 'Failed to copy workout summary to clipboard.',
          tone: 'error',
        })
        console.error('Clipboard API failed:', err)
      }
    }
    setIsSharing(false)
  }

  // Calculate workout summary statistics
  const workoutSummary = useMemo(() => {
    if (!dashboardData?.recentWorkouts) return null
    const totalWorkouts = dashboardData.recentWorkouts.length
    const totalCalories = dashboardData.recentWorkouts.reduce(
      (sum, workout) => sum + workout.energy,
      0,
    )
    const averageDuration =
      totalWorkouts > 0
        ? dashboardData.recentWorkouts.reduce(
            (sum, workout) => sum + workout.duration,
            0,
          ) /
          totalWorkouts /
          60
        : 0
    return { totalWorkouts, totalCalories, averageDuration }
  }, [dashboardData?.recentWorkouts])

  const handleWorkoutCardClick = (workout: Workout) => {
    setSelectedWorkoutForDetails(workout)
    setIsDetailsModalOpen(true)
  }

  return (
    <PageLayout className="max-w-6xl">
      {/* Moved header content from PageLayout props to its children */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Apple Fitness Dashboard
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Your Health & Activity Summary
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          View your activity rings, workout history, and health trends.
        </p>
      </div>
      {loading && <p>Loading your Apple Fitness data...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {dashboardData && (
        <>
          <RecentWorkoutsSection
            initialWorkouts={dashboardData.recentWorkouts}
            onWorkoutCardClick={handleWorkoutCardClick}
          />
          <div className="space-y-6">
            {dashboardData.activityRings && (
              <ActivityRingsDisplay data={dashboardData.activityRings} />
            )}

            <WorkoutSummaryCard
              workoutSummary={workoutSummary}
              handleShareSummary={handleShareSummary}
              isSharing={isSharing}
              shareStatus={shareStatus}
            />
            {dashboardData.workoutTrends &&
              dashboardData.workoutTrends.length > 0 && (
                <WorkoutTrendsChart trends={dashboardData.workoutTrends} />
              )}
          </div>
        </>
      )}
      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        workout={selectedWorkoutForDetails}
      />
    </PageLayout>
  )
}
