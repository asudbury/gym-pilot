import React from 'react'
import type { ActivityRingData } from '../../types/healthData'

type ActivityRingsDisplayProps = {
  data: ActivityRingData
}

export const ActivityRingsDisplay: React.FC<ActivityRingsDisplayProps> = ({
  data,
}) => {
  const {
    moveGoal,
    moveProgress,
    exerciseGoal,
    exerciseProgress,
    standGoal,
    standProgress,
  } = data

  // Simple percentage calculation for display, capped at 100% for visual representation
  const movePercentage = Math.min(100, (moveProgress / moveGoal) * 100)
  const exercisePercentage = Math.min(
    100,
    (exerciseProgress / exerciseGoal) * 100,
  )
  const standPercentage = Math.min(100, (standProgress / standGoal) * 100)

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-white shadow-sm dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Activity Rings
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Move Ring */}
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 rounded-full bg-red-200 flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#ef4444 ${movePercentage}%, #fecaca ${movePercentage}%)`,
              }}
            ></div>
            <span className="relative text-sm font-bold text-red-800 dark:text-red-200">
              {Math.round(moveProgress)}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Move ({moveGoal})
          </p>
        </div>

        {/* Exercise Ring */}
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 rounded-full bg-green-200 flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#22c55e ${exercisePercentage}%, #dcfce7 ${exercisePercentage}%)`,
              }}
            ></div>
            <span className="relative text-sm font-bold text-green-800 dark:text-green-200">
              {Math.round(exerciseProgress)}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Exercise ({exerciseGoal})
          </p>
        </div>

        {/* Stand Ring */}
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#3b82f6 ${standPercentage}%, #bfdbfe ${standPercentage}%)`,
              }}
            ></div>
            <span className="relative text-sm font-bold text-blue-800 dark:text-blue-200">
              {Math.round(standProgress)}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Stand ({standGoal})
          </p>
        </div>
      </div>
    </div>
  )
}
