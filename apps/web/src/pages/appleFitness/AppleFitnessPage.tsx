import {
    getImportedWorkouts,
    type ImportedWorkout as Workout,
} from '@gym-pilot/shared';
import { getSupabaseClient } from '@gym-pilot/shared/src/supabase';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { AppleFitnessWorkoutCard } from '../../components/AppleFitnessWorkoutCard';
import { Button } from '../../components/ui/Button';
import { DecorativeIcon } from '../../components/ui/DecorativeIcon';
import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification';
import WorkoutCalendar from '../../components/WorkoutCalendar';
import { PageCardLayout } from '../../layouts/PageCardLayout';
import { PageLayout } from '../../layouts/PageLayout';

type ImportWorkoutsResponse = {
  data?: unknown[]
  changedWorkouts?: Workout[]
  importedCount?: number
  error?: string
}

export const AppleFitnessPage: React.FC = () => {
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

        // Validate parsed components
        if (
          isNaN(year) ||
          isNaN(month) ||
          isNaN(day) ||
          month < 0 ||
          month > 11 ||
          day < 1 ||
          day > 31
        ) {
          return new Date()
        }

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
              setError(null)
              const workoutsFromFile = data.workouts
              void handleImport(workoutsFromFile)
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

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleImport = async (workoutsToImportOverride?: Workout[]) => {
    setMessage(null)
    setError(null)
    setIsLoading(true)

    try {
      const workoutsToImport = workoutsToImportOverride ?? workouts

      const client = getSupabaseClient()
      if (!client) {
        setError('Supabase client not available.')
        return
      }

      const {
        data: { session },
      } = await client.auth.getSession()

      if (!session) {
        setError('You must be logged in to import workouts.')
        return
      }

      const BATCH_SIZE = 100
      let totalImportedCount = 0
      const allChangedWorkouts: Workout[] = []
      let hasError = false

      for (let i = 0; i < workoutsToImport.length; i += BATCH_SIZE) {
        const batch = workoutsToImport.slice(i, i + BATCH_SIZE)

        try {
          const { data: importResult, error: importError } =
            await client.functions.invoke<ImportWorkoutsResponse>(
              'import-workouts',
              {
                body: { workouts: batch },
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              },
            )

          if (importError) {
            const details =
              typeof importError.message === 'string' &&
              importError.message.trim()
                ? importError.message
                : 'Unknown error'

            setError(`Import failed: ${details}`)
            hasError = true
            break
          }

          const payload = (importResult ?? {}) as ImportWorkoutsResponse

          if (payload.error) {
            setError(`Import failed: ${payload.error}`)
            hasError = true
            break
          }

          totalImportedCount += payload.importedCount ?? 0
          allChangedWorkouts.push(...(payload.changedWorkouts ?? []))
        } catch (error) {
          setError(
            error instanceof Error
              ? `An error occurred during import: ${error.message}`
              : 'An error occurred during import.',
          )
          hasError = true
          break
        }
      }

      if (hasError) {
        return
      }

      const importedMessage =
        totalImportedCount > 0
          ? `Imported ${totalImportedCount} new or changed workout${totalImportedCount === 1 ? '' : 's'}.`
          : 'No new or changed workouts to import.'

      setWorkouts(allChangedWorkouts)
      setMessage(importedMessage)
      setImportCount((c) => c + 1)
    } catch (error) {
      setError(
        error instanceof Error
          ? `An error occurred during import: ${error.message}`
          : 'An error occurred during import.',
      )
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

        const { data } = await getImportedWorkouts(user.id, {
          date: searchParams.get('date') ?? undefined,
        })
        if (isActive) {
          setCurrentWorkouts(data ?? [])
        }
      } catch (error) {
        setMessage(`Failed to load imported workouts: ${error}`)
      }
    }
    void loadWorkouts()
    return () => {
      isActive = false
    }
  }, [user?.id, importCount, searchParams])

  return (
    <PageLayout className="gap-6">
      <PageCardLayout
        title="Apple fitness"
        description="Manage your imported Apple Fitness workouts and link them to user sessions."
        icon="apple"
      >
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleUploadButtonClick}
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
          <Button as={NavLink} to="/analysis" tone="default">
            Analysis
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <Button as={NavLink} to="/apple-fitness/import-spreadsheet" tone="default">
            Import spreadsheet sessions
          </Button>
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
      </PageCardLayout>
    </PageLayout>
  )
}
