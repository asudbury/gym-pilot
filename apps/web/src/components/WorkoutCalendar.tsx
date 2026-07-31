import React, { useState, useMemo } from 'react'
import Calendar from 'react-calendar'
import type { ImportedWorkout } from '@gym-pilot/shared'
import { AppleFitnessWorkoutCard } from './AppleFitnessWorkoutCard'
import { StatusMessageNotification } from './ui/StatusMessageNotification'

// Define a type that matches react-calendar's Value for single selection, which can be Date or null
type CalendarValue = Date | null

interface WorkoutCalendarProps {
  workouts: ImportedWorkout[]
  title?: string
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ workouts }) => {
  const [selectedDate, setSelectedDate] = useState<CalendarValue>(new Date())

  // Pre-process workouts to easily look up counts per day
  const dailyWorkoutCounts = useMemo(() => {
    const counts = new Map<string, number>() // Key: YYYY-MM-DD, Value: count
    workouts.forEach((workout) => {
      const date = new Date(workout.start_date)
      // Ensure date is valid before proceeding.
      // Use local date components to avoid timezone issues with toISOString().
      // toISOString() returns UTC, which can be a day off in local time.
      if (!isNaN(date.getTime())) {
        const dateKey = date.toISOString().split('T')[0] // Get YYYY-MM-DD
        counts.set(dateKey, (counts.get(dateKey) || 0) + 1)
      }
    })
    return counts
  }, [workouts])

  // Function to render custom content on each calendar tile
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    // Only apply custom content to 'month' view tiles
    if (view === 'month') {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0') // Month is 0-indexed
      const day = date.getDate().toString().padStart(2, '0')
      const dateKey = `${year}-${month}-${day}`
      const count = dailyWorkoutCounts.get(dateKey)

      if (count && count > 0) {
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
                backgroundColor: '#4CAF50', // Green dot for workout days
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
              title={`${count} workout(s)`}
            >
              {count}
            </span>
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
    }
  }

  const workoutsForSelectedDate = useMemo(() => {
    if (!selectedDate || Array.isArray(selectedDate)) {
      return []
    }
    return workouts.filter((workout) => {
      const workoutDate = new Date(workout.start_date)
      return (
        workoutDate.getFullYear() === selectedDate.getFullYear() &&
        workoutDate.getMonth() === selectedDate.getMonth() &&
        workoutDate.getDate() === selectedDate.getDate()
      )
    })
  }, [workouts, selectedDate])

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '20px auto' }}>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={tileContent}
      />
      {selectedDate && !Array.isArray(selectedDate) && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>
            Workouts on {selectedDate.toDateString()}:
          </h3>
          {workoutsForSelectedDate.length > 0 ? (
            workoutsForSelectedDate.map((workout) => (
              <div className="mb-4" key={workout.id}>
              <AppleFitnessWorkoutCard workout={workout} />
              </div>
            ))
          ) : (
            <StatusMessageNotification message="No workouts on this day." tone="info" />
          )}
        </div>
      )}
    </div>
  )
}

export default WorkoutCalendar
