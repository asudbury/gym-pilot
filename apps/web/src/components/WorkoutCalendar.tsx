import React, { useState, useMemo, useEffect } from 'react'
import Calendar from 'react-calendar'
import {
  type ImportedWorkout,
  updateImportedWorkout,
  getSupabaseClient,
  type UserSession,
} from '@gym-pilot/shared'
import { AppleFitnessWorkoutCard } from './AppleFitnessWorkoutCard'
import { StatusMessageNotification } from './ui/StatusMessageNotification'
import { Button } from './ui/Button' // Import Button component
import {
  NO_LINK_SESSION_ID,
  resolveWorkoutLinkState,
} from './workoutCalendarUtils'

// Define a type that matches react-calendar's Value for single selection, which can be Date or null
type CalendarValue = Date | null

interface WorkoutCalendarProps {
  workouts: ImportedWorkout[]
  title?: string
  initialDate?: CalendarValue
  onDateChange?: (date: CalendarValue) => void
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({
  workouts: initialWorkouts,
  initialDate,
  onDateChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<CalendarValue>(
    initialDate || new Date(),
  )
  const [activeStartDate, setActiveStartDate] = useState<Date>(
    initialDate || new Date(),
  )
  const [localWorkouts, setLocalWorkouts] =
    useState<ImportedWorkout[]>(initialWorkouts)
  const [linkedSessionsMap, setLinkedSessionsMap] = useState<
    Map<string, UserSession>
  >(new Map())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLocalWorkouts(initialWorkouts)
  }, [initialWorkouts])

  useEffect(() => {
    const fetchLinkedSessions = async () => {
      const sessionIds = localWorkouts
        .map((w) => w.session_id)
        .filter((id): id is string => id !== null)
      if (sessionIds.length > 0) {
        const client = getSupabaseClient()
        if (client) {
          const { data, error } = await client
            .from('gym_pilot_user_session')
            .select('*')
            .in('id', sessionIds)

          if (error) {
            setError('Failed to fetch linked sessions.')
          } else {
            const sessionMap = new Map<string, UserSession>()
            data?.forEach((session: UserSession) => {
              sessionMap.set(session.id, session)
            })
            setLinkedSessionsMap(sessionMap)
          }
        }
      }
    }
    fetchLinkedSessions()
  }, [localWorkouts])

  const handleUnlinkWorkout = async (workoutToUnlink: ImportedWorkout) => {
    try {
      const updatedWorkout = { ...workoutToUnlink, session_id: null }
      const { error } = await updateImportedWorkout(updatedWorkout)
      if (error) {
        throw new Error(
          'Failed to unlink workout. Please check the console for details.',
        )
      }
      setLocalWorkouts((prevWorkouts) =>
        prevWorkouts.map((w) =>
          w.id === updatedWorkout.id ? updatedWorkout : w,
        ),
      )
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleNoLinkWorkout = async (workoutToUnlink: ImportedWorkout) => {
    try {
      const updatedWorkout = {
        ...workoutToUnlink,
        session_id: NO_LINK_SESSION_ID,
      }
      const { error } = await updateImportedWorkout(updatedWorkout)
      if (error) {
        throw new Error(
          'Failed to unlink workout. Please check the console for details.',
        )
      }
      setLocalWorkouts((prevWorkouts) =>
        prevWorkouts.map((w) =>
          w.id === updatedWorkout.id ? updatedWorkout : w,
        ),
      )
    } catch (e: any) {
      setError(e.message)
    }
  }

  // Pre-process workouts to easily look up counts per day
  const dailyWorkoutCounts = useMemo(() => {
    const counts = new Map<
      string,
      { count: number; linkState: 'linked' | 'unassigned' | 'no-link' }
    >()
    localWorkouts.forEach((workout) => {
      const date = new Date(workout.start_date)
      if (!isNaN(date.getTime())) {
        const dateKey = date.toISOString().split('T')[0]
        const current = counts.get(dateKey) || {
          count: 0,
          linkState: 'linked' as const,
        }
        const linkState = resolveWorkoutLinkState(workout.session_id)
        counts.set(dateKey, {
          count: current.count + 1,
          linkState:
            current.linkState === 'no-link' || linkState === 'no-link'
              ? 'no-link'
              : current.linkState === 'unassigned' || linkState === 'unassigned'
                ? 'unassigned'
                : 'linked',
        })
      }
    })
    return counts
  }, [localWorkouts])

  // Function to add custom classes to each calendar tile
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`
      const dailyData = dailyWorkoutCounts.get(dateKey)

      if (dailyData) {
        switch (dailyData.linkState) {
          case 'no-link':
            return 'has-no-link-workouts'
          case 'unassigned':
            return 'has-unassigned-workouts'
          case 'linked':
            return 'has-linked-workouts'
          default:
            return null
        }
      } else {
        // Apply a class for days without any workouts
        return 'has-no-workouts'
      }
    }
    return null
  }

  // Function to render custom content on each calendar tile
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    // Only apply custom content to 'month' view tiles
    if (view === 'month') {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0') // Month is 0-indexed
      const day = date.getDate().toString().padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`
      const dailyData = dailyWorkoutCounts.get(dateKey)
      const count = dailyData?.count || 0
      const linkState = dailyData?.linkState || 'linked'

      if (count > 0) {
        const dotColor =
          linkState === 'no-link'
            ? '#3B82F6'
            : linkState === 'unassigned'
              ? '#FFC107'
              : '#4CAF50'
        return (
          <div className="workout-dot-container mt-1.5 flex items-center justify-center">
            <span
              className="workout-dot flex h-5 w-5 items-center justify-center rounded-full text-[0.7em] font-bold text-white"
              style={{ backgroundColor: dotColor }}
              title={`${count} workout(s) ${
                linkState === 'no-link'
                  ? '(no link selected)'
                  : linkState === 'unassigned'
                    ? '(unassigned)'
                    : ''
              }`}
            >
              {count}
            </span>
          </div>
        )
      } else {
        return (
          <div className="workout-dot-container mt-1.5 flex h-5 items-center justify-center">
            {/* Empty span for uniform alignment when no workouts */}
          </div>
        )
      }
    }
    return null // No custom content for other days or views
  }

  // Update handleDateChange to accept CalendarValue (Date | null) and the optional event
  const handleDateChange = (value: any) => {
    const newDate = Array.isArray(value) ? value[0] : value
    if (newDate instanceof Date || newDate === null) {
      setSelectedDate(newDate)
      if (newDate) {
        setActiveStartDate(newDate) // Keep the calendar view in sync
      }
      if (onDateChange) {
        onDateChange(newDate)
      }
    }
  }

  const handleTodayClick = () => {
    const today = new Date()
    setSelectedDate(today)
    setActiveStartDate(today)
    if (onDateChange) {
      onDateChange(today)
    }
  }

  const workoutsForSelectedDate = useMemo(() => {
    if (!selectedDate || Array.isArray(selectedDate)) {
      return []
    }
    return localWorkouts.filter((workout) => {
      const workoutDate = new Date(workout.start_date)
      return (
        workoutDate.getFullYear() === selectedDate.getFullYear() &&
        workoutDate.getMonth() === selectedDate.getMonth() &&
        workoutDate.getDate() === selectedDate.getDate()
      )
    })
  }, [localWorkouts, selectedDate])

  return (
    <div className="mx-auto my-5 w-full max-w-150 rounded-lg border border-slate-200 p-2.5">
      {error && (
        <StatusMessageNotification
          message={error}
          tone="error"
          onDismiss={() => setError(null)}
        />
      )}
      <div className="text-right mr-3">
        <Button onClick={handleTodayClick}>Today</Button>
      </div>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
        tileClassName={tileClassName} // Add this line
        activeStartDate={activeStartDate}
        onActiveStartDateChange={({ activeStartDate }) =>
          setActiveStartDate(activeStartDate ?? new Date())
        }
      />
      {selectedDate && !Array.isArray(selectedDate) && (
        <div className="mt-5">
          <h3 className="mb-2.5 text-slate-800">
            <b>Workouts on {selectedDate.toDateString()}</b>
          </h3>
          {workoutsForSelectedDate.length > 0 ? (
            workoutsForSelectedDate.map((workout) => (
              <div className="mb-4" key={workout.id}>
                <AppleFitnessWorkoutCard
                  workout={workout}
                  onUnlink={handleUnlinkWorkout}
                  onNoLink={handleNoLinkWorkout}
                  linkedSession={
                    workout.session_id
                      ? linkedSessionsMap.get(workout.session_id)
                      : undefined
                  }
                  selectedDate={selectedDate}
                />
              </div>
            ))
          ) : (
            <StatusMessageNotification
              message="No workouts on this day"
              tone="info"
            />
          )}
        </div>
      )}
    </div>
  )
}

export default WorkoutCalendar
