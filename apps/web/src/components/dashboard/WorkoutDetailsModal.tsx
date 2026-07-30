import React from 'react'
import { Modal } from '../ui/Modal'
import { DecorativeIcon } from '../ui/DecorativeIcon'
import { AppleFitnessWorkoutCard } from '../../components/AppleFitnessWorkoutCard'
import type { Workout } from '../../types/healthData'

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
  if (!workout) return null // Don't render if no workout is selected

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
            {workout.display_name} Details
          </h3>
          <AppleFitnessWorkoutCard workout={workout} />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Source: {workout.source.name}
          </p>
        </div>
      </div>
    </Modal>
  )
}
