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

  // Pre-process workouts to easily look up counts per day
  const dailyWorkoutCounts = useMemo(() => {
    const counts = new Map<string, { count: number; hasUnassigned: boolean }>()
    localWorkouts.forEach((workout) => {
      const date = new Date(workout.start_date)
      if (!isNaN(date.getTime())) {
        const dateKey = date.toISOString().split('T')[0]
        const current = counts.get(dateKey) || {
          count: 0,
          hasUnassigned: false,
        }
        counts.set(dateKey, {
          count: current.count + 1,
          hasUnassigned: current.hasUnassigned || workout.session_id === null,
        })
      }
    })
    return counts
  }, [localWorkouts])

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
      const hasUnassigned = dailyData?.hasUnassigned || false

      if (count > 0) {
        const dotColor = hasUnassigned ? '#FFC107' : '#4CAF50' // Amber for unassigned, Green for assigned
        return (
          <div
            className="workout-dot-container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '5px',
            }}
          >
            <span
              className="workout-dot"
              style={{
                backgroundColor: dotColor,
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '0.7em',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: 'bold',
              }}
              title={`${count} workout(s) ${
                hasUnassigned ? '(unassigned)' : ''
              }`}
            >
              {count}
            </span>
          </div>
        )
      } else {
        return (
          <div
            className="workout-dot-container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '5px',
              height: '20px', // Maintain height for alignment
            }}
          >
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
      if (onDateChange) {
        onDateChange(newDate)
      }
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
    <div
      style={{
        width: '100%',
        maxWidth: '600px',
        margin: '20px auto',
        border: '1px solid #e0e0e0', // Add a border
        borderRadius: '8px', // Add border radius
        padding: '10px', // Optional: add some padding inside the border
      }}
    >
      {error && (
        <StatusMessageNotification
          message={error}
          tone="error"
          onDismiss={() => setError(null)}
        />
      )}
      <div className="text-right mr-3">
        <Button onClick={() => handleDateChange(new Date())}>Today</Button>
      </div>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
      />
      {selectedDate && !Array.isArray(selectedDate) && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>
            <b>Workouts on {selectedDate.toDateString()}:</b>
          </h3>
          {workoutsForSelectedDate.length > 0 ? (
            workoutsForSelectedDate.map((workout) => (
              <div className="mb-4" key={workout.id}>
                <AppleFitnessWorkoutCard
                  workout={workout}
                  onUnlink={handleUnlinkWorkout}
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
              message="No workouts on this day."
              tone="info"
            />
          )}
        </div>
      )}
    </div>
  )
}

export default WorkoutCalendar
