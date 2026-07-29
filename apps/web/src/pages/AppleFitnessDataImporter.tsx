import React, { useState, useRef } from 'react'
import { PageLayout } from '../layouts/PageLayout'
import { PageCard } from '../components/PageCard'
import { Button } from '../components/ui/Button'
import type { Workout } from '../types/healthData'

const AppleFitnessDataImporter: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result
          if (typeof content === 'string') {
            const data: { workouts: Workout[] } = JSON.parse(content)
            if (data && data.workouts) {
              setWorkouts(data.workouts)
              setError(null)
            } else {
              setError('Invalid JSON format: "workouts" array not found.')
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

  return (
    <PageLayout className="gap-6">
      <PageCard as="section" className="space-y-6">
        <h1 className="text-2xl font-bold">Apple Fitness Data Importer</h1>
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleButtonClick}
            tone={workouts.length === 0 ? 'emerald' : 'default'}
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
        {error && <p className="text-red-500">{error}</p>}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Workouts{' '}
            <span className="ml-2 text-slate-400">({workouts.length})</span>
          </h2>
          {workouts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="bg-blue-50 dark:bg-slate-800 p-4 rounded-lg shadow"
                >
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {workout.display_name}
                  </div>
                  <div className="text-m font-semibold text-slate-600 dark:text-slate-100">
                    {workout.energy.toFixed(0)} {workout.energy_unit}
                  </div>
                  <div className="text-m text-slate-600 dark:text-slate-400 mt-2">
                    <p>
                      {(() => {
                        const date = new Date(workout.start_date)

                        const getDayWithSuffix = (day: number): string => {
                          if (day > 3 && day < 21) return day + 'th'
                          switch (day % 10) {
                            case 1:
                              return day + 'st'
                            case 2:
                              return day + 'nd'
                            case 3:
                              return day + 'rd'
                            default:
                              return day + 'th'
                          }
                        }

                        const weekday = date.toLocaleString('en-US', {
                          weekday: 'short',
                        })
                        const dayOfMonth = getDayWithSuffix(date.getDate())
                        const hour = date.toLocaleString('en-US', {
                          hour: '2-digit',
                          hourCycle: 'h23',
                        })
                        const minute = date.toLocaleString('en-US', {
                          minute: '2-digit',
                        })

                        return `${weekday} ${dayOfMonth} at ${hour}:${minute}`
                      })()}
                      <span className="ml-2" />(
                      {(workout.duration / 60).toFixed(0)} minutes)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">
              No workouts to display. Upload a JSON file to see workout data.
            </p>
          )}
        </div>

        {workouts.length > 0 && (
          <Button tone="emerald">Import Workouts to Gym-Pilot</Button>
        )}
      </PageCard>
    </PageLayout>
  )
}

export default AppleFitnessDataImporter
