import type { ImportedWorkout } from '@gym-pilot/shared'
import { getImportedWorkouts } from '@gym-pilot/shared'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export function useImportedWorkouts() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState<ImportedWorkout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    const loadWorkouts = async () => {
      try {
        if (user?.id == null) {
          setWorkouts([])
          setLoading(false)
          return
        }

        const { data } = await getImportedWorkouts(user.id)
        if (isActive) {
          setWorkouts(data ?? [])
        }
      } catch (error) {
        console.error('Failed to load imported workouts:', error)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }
    void loadWorkouts()
    return () => {
      isActive = false
    }
  }, [user?.id])

  return { workouts, loading }
}
