import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageLayout } from '../../layouts/PageLayout'
import { PageCard } from '../../components/PageCard'
import { Button } from '../../components/ui/Button'
import {
  getImportedWorkouts,
  type ImportedWorkout as Workout,
} from '@gym-pilot/shared'
import { getSupabaseClient } from '@gym-pilot/shared/src/supabase'
import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification'
import { AppleFitnessWorkoutCard } from '../../components/AppleFitnessWorkoutCard'
import { DecorativeIcon } from '../../components/ui/DecorativeIcon'
import WorkoutCalendar from '../../components/WorkoutCalendar'
import { useAuth } from '../../auth/AuthContext'

export const DataImporterPage: React.FC = () => {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentWorkouts, setCurrentWorkouts] = useState<Workout[]>([])
  const [importCount, setImportCount] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      setSearchParams({ date: `${year}-${month}-${day}` })
    }
  }

  const initialDate = useMemo(() => {
    const dateStr = searchParams.get('date')
    if (dateStr) {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // month is 0-indexed
        const day = parseInt(parts[2], 10)
        const date = new Date(year, month, day)

        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }
    return new Date()
  }, [searchParams])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setMessage(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result
          if (typeof content === 'string') {
            const data: { workouts: Workout[] } = JSON.parse(content)
            if (data && data.workouts) {
              setWorkouts(data.workouts)
              setError(null)
              handleImport()
            } else {
              setError('Invalid JSON format: "workouts" array not found.')
              setMessage(null)
            }
          }
        } catch (err) {
          setError('Error parsing JSON file.')
          console.error(err)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleImport = async () => {
    setMessage(null)
    setError(null)
    setIsLoading(true)

    const workoutsToImport = workouts

    const client = getSupabaseClient()
    if (!client) {
      setError('Supabase client not available.')
      setIsLoading(false)
      return
    }

    const {
      data: { session },
    } = await client.auth.getSession()

    if (!session) {
      setError('You must be logged in to import workouts.')
      setIsLoading(false)
      return
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const functionUrl = `${supabaseUrl}/functions/v1/import-workouts`

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ workouts: workoutsToImport }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        setError(`Import failed: ${errorText}`)
      } else {
        setMessage('Workouts imported successfully!')
        setImportCount((c) => c + 1)
      }
    } catch (error) {
      setError('An error occurred during import.')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch workouts for the calendar
  useEffect(() => {
    let isActive = true

    const loadWorkouts = async () => {
      try {
        if (user?.id == null) {
          setWorkouts([])
          return
        }

        const { data } = await getImportedWorkouts(user.id)
        if (isActive) {
          setCurrentWorkouts(data ?? [])
        }
      } catch (error) {
        console.error('Failed to load imported workouts:', error)
      }
    }
    void loadWorkouts()
    return () => {
      isActive = false
    }
  }, [user?.id, importCount])

  return (
    <PageLayout className="gap-6">
      <PageCard as="section" className="space-y-6">
        <h1 className="text-2xl font-bold">Apple Fitness</h1>

        <div className="flex items-center space-x-4">
          <Button
            onClick={handleButtonClick}
            tone="emerald"
            disabled={isLoading}
          >
            Upload Fitness data file
          </Button>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
          />
        </div>

        {message && <StatusMessageNotification tone="info" message={message} />}

        {isLoading && (
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <DecorativeIcon icon="spinner" className="animate-spin" />
            <span>Importing workouts... Please wait.</span>
          </div>
        )}

        {error && <StatusMessageNotification tone="error" message={error} />}

        <div>
          {workouts.length > 0 && (
            <h2 className="text-xl font-semibold mb-4">Workouts </h2>
          )}
          {workouts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workouts.map((workout) => (
                <AppleFitnessWorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mt-8">
            <WorkoutCalendar
              workouts={currentWorkouts}
              title="Workout Overview Calendar"
              initialDate={initialDate}
              onDateChange={handleDateChange}
            />
          </div>
        </div>
      </PageCard>
    </PageLayout>
  )
}
