import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { DecorativeIcon } from '../ui/DecorativeIcon'
import { AppleFitnessWorkoutCard } from '../../components/AppleFitnessWorkoutCard'
import type { Workout } from '../../types/healthData'
import { Button } from '../ui/Button'
import { StatusMessageNotification } from '../ui/StatusMessageNotification'

type WorkoutDetailsModalProps = {
  isOpen: boolean
  onClose: () => void
  workout: Workout | null
}

export const WorkoutDetailsModal: React.FC<WorkoutDetailsModalProps> = ({
  isOpen,
  onClose,
  workout,
}) => {
  const [isSharing, setIsSharing] = useState(false)
  const [shareStatus, setShareStatus] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)

  if (!workout) return null // Don't render if no workout is selected

  const handleShareWorkout = async () => {
    if (!workout) return
    setIsSharing(true)
    setShareStatus(null)

    const startDate = new Date(workout.start_date)
    const formattedDate = startDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const formattedTime = startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const durationMinutes = (workout.duration / 60).toFixed(0)

    const shareText = `
My recent workout: ${workout.display_name}
🗓️ Date: ${formattedDate} at ${formattedTime}
⏱️ Duration: ${durationMinutes} minutes
🔥 Calories Burned: ${workout.energy.toFixed(0)} ${workout.energy_unit}
💪 Type: ${workout.type}
Source: ${workout.source.name}
Check out Gym-Pilot for more!
    `.trim()

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${workout.display_name} Workout Details`,
          text: shareText,
        })
        setShareStatus({ message: 'Workout shared successfully!', tone: 'success' })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setShareStatus({ message: 'Failed to share workout.', tone: 'error' })
          console.error('Web Share API failed:', err)
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(shareText)
        setShareStatus({ message: 'Workout details copied to clipboard!', tone: 'success' })
      } catch (err) {
        setShareStatus({ message: 'Failed to copy to clipboard.', tone: 'error' })
        console.error('Clipboard API failed:', err)
      }
    }
    setIsSharing(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative h-full w-full bg-white p-6 shadow-lg dark:bg-slate-900 sm:h-auto sm:max-w-md sm:rounded-lg">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          aria-label="Close"
        >
          <DecorativeIcon icon="close" className="h-6 w-6" />
        </button>
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {workout.display_name}
          </h3>
          <AppleFitnessWorkoutCard workout={workout} onClick={() => {}} />
          <div className="flex justify-end">
            <Button
              onClick={handleShareWorkout}
              tone="default"
              isLoading={isSharing}
              loadingLabel="Sharing..."
            >
              <DecorativeIcon icon="share" className="h-4 w-4" /> Share Workout
            </Button>
          </div>
          {shareStatus && (
            <StatusMessageNotification
              message={shareStatus.message}
              tone={shareStatus.tone}
            />
          )}
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Source: {workout.source.name}
          </p>
        </div>
      </div>
    </Modal>
  )
}
