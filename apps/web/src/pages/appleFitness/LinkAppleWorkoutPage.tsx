import {
  type ImportedWorkout,
  getImportedWorkout,
  listSessions,
  updateImportedWorkout,
  type UserSession,
} from '@gym-pilot/shared'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { PageLayout } from '../../layouts/PageLayout'
import { AppleFitnessWorkoutCard } from '../../components/AppleFitnessWorkoutCard'

export function LinkAppleWorkoutPage() {
  const { user } = useAuth()
  const { workoutId } = useParams<{ workoutId: string }>()
  const [workout, setWorkout] = useState<ImportedWorkout | null>(null)
  const [userSessions, setUserSessions] = useState<UserSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
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
          setErrorMessage(String(error))
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

        const sessions = await listSessions({ userId })

        if (isActive) {
          setUserSessions(sessions ?? [])
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(String(error))
        }
      }
    }

    void loadUserSessions()

    return () => {
      isActive = false
    }
  }, [userId])

  const handleLinkWorkout = async () => {
    if (!selectedSession || !workout) {
      setErrorMessage('Please select a session to link.')
      return
    }

    try {
      // This is a placeholder for the actual linking logic.
      // We will update the imported workout with the session id.
      const updatedWorkout = { ...workout, session_id: selectedSession }
      await updateImportedWorkout(updatedWorkout)

      setSuccessMessage('Workout linked successfully!')
    } catch (error) {
      setErrorMessage(String(error))
    }
  }

  const handleSessionSelection = (sessionId: string) => {
    setSelectedSession(sessionId)
  }

  return (
    <PageLayout className="max-w-6xl">
      <PageCardLayout
        title="Link Apple Workout"
        subtitle="Link your imported Apple Fitness workout to a user session"
        icon="user"
      >
        {successMessage && (
          <StatusMessageNotification
            message={successMessage}
            tone="success"
            className="mb-3"
          />
        )}
        {errorMessage && (
          <StatusMessageNotification
            message={errorMessage}
            tone="error"
            className="mb-3"
          />
        )}

        {workout ? (
          <div className="space-y-4">
            <AppleFitnessWorkoutCard workout={workout} showLinkButton={false} />
            <div>
              <h3 className="text-lg font-semibold">
                Select a session to link:
              </h3>
              <div className="space-y-2 mt-2">
                {userSessions.map((session) => (
                  <div key={session.id} className="flex items-center">
                    <input
                      type="radio"
                      name="session"
                      id={session.id}
                      value={session.id}
                      checked={selectedSession === session.id}
                      onChange={() => handleSessionSelection(session.id)}
                      className="mr-2"
                    />
                    <label htmlFor={session.id}>
                      {session.class_name || 'Solo Session'} -{' '}
                      {new Date(session.start_at).toLocaleString()}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleLinkWorkout} disabled={!selectedSession}>
              Link Workout
            </Button>
          </div>
        ) : (
          <p>Loading workout...</p>
        )}
      </PageCardLayout>
    </PageLayout>
  )
}
