import {
  getImportedWorkout,
  listSessions,
  updateImportedWorkout,
  type ImportedWorkout,
  type UserSession,
} from '@gym-pilot/shared'
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { AppleFitnessWorkoutCard } from '../../components/AppleFitnessWorkoutCard'
import RecordButtons from '../../components/RecordButtons'
import { SessionEntryCard } from '../../components/session-history/SessionEntryCard'
import { Button } from '../../components/ui/Button'
import { DecorativeIcon } from '../../components/ui/DecorativeIcon'
import {
  StatusMessageNotification,
  type DisplayableError,
} from '../../components/ui/StatusMessageNotification'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { PageLayout } from '../../layouts/PageLayout'

export function LinkAppleWorkoutPage() {
  const { user } = useAuth()
  const { workoutId } = useParams<{ workoutId: string }>()
  const [workout, setWorkout] = useState<ImportedWorkout | null>(null)
  const [userSessions, setUserSessions] = useState<UserSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<DisplayableError | null>(
    null,
  )
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = user?.id ?? null

  useEffect(() => {
    let isActive = true

    const loadWorkout = async () => {
      try {
        if (!userId || !workoutId) {
          setWorkout(null)
          return
        }

        const { data, error } = await getImportedWorkout(userId, workoutId)

        if (error) {
          throw error
        }

        if (isActive) {
          setWorkout(data)
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error as DisplayableError)
        }
      }
    }

    void loadWorkout()

    return () => {
      isActive = false
    }
  }, [userId, workoutId])

  useEffect(() => {
    let isActive = true

    const loadUserSessions = async () => {
      try {
        if (!userId) {
          setUserSessions([])
          return
        }

        if (!workout?.start_date) {
          setUserSessions([])
          return
        }

        const { sessions, error } = await listSessions({
          userId,
          from: workout?.start_date,
        })
        if (error) {
          throw error
        }

        if (isActive) {
          setUserSessions(sessions ?? [])
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error as DisplayableError)
        }
      }
    }

    void loadUserSessions()

    return () => {
      isActive = false
    }
  }, [userId, workout?.start_date])

  const handleLinkWorkout = async () => {
    if (!selectedSession || !workout) {
      setErrorMessage('Please select a session to link.')
      return
    }

    try {
      setErrorMessage(null)
      const updatedWorkout = { ...workout, session_id: selectedSession }
      const { error } = await updateImportedWorkout(updatedWorkout)
      if (error) {
        throw error
      }
      const backDate = searchParams.get('back_date')
      const targetUrl = backDate
        ? `/apple-fitness?date=${backDate}`
        : '/apple-fitness'
      navigate(targetUrl)
    } catch (error) {
      setErrorMessage(error)
    }
  }

  const handleCancel = () => {
    const backDate = searchParams.get('back_date')
    const targetUrl = backDate
      ? `/apple-fitness?date=${backDate}`
      : '/apple-fitness'
    navigate(targetUrl)
    setErrorMessage(null)
  }
  const handleSessionSelection = (sessionId: string) => {
    setSelectedSession(sessionId)
  }

  return (
    <PageLayout className="max-w-6xl">
      <PageCardLayout
        title="Link Apple Workout"
        subtitle="Link your imported Apple Fitness workout to a user session"
        icon="apple"
      >
        {workout ? (
          <div className="space-y-4">
            <AppleFitnessWorkoutCard workout={workout} showLinkButton={false} />
            <div>
              <h3 className="text-lg font-semibold">
                Select a session to link:
              </h3>

              <div className="space-y-2 mt-2">
                {userSessions.map((session) => (
                  <SessionEntryCard
                    key={session.id}
                    entry={session}
                    onSelect={handleSessionSelection}
                    selected={selectedSession === session.id}
                  >
                    {selectedSession === session.id && (
                      <div className="mt-4">
                        <Button tone="emerald" onClick={handleLinkWorkout}>
                          Confirm
                        </Button>
                        <Button
                          tone="default"
                          onClick={handleCancel}
                          className="ml-2"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </SessionEntryCard>
                ))}
              </div>
            </div>

            <RecordButtons recordText="Create a" />

            {errorMessage != null && (
              <StatusMessageNotification
                message={errorMessage}
                tone="error"
                className="mb-3"
              />
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <DecorativeIcon icon="spinner" />
            <span>Loading...</span>
          </div>
        )}
      </PageCardLayout>
    </PageLayout>
  )
}
