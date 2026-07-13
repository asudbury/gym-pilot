import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { getToneClass } from '../components/toneClasses'
import { exercises, usePlan } from '@gym-pilot/shared'
import type { WeeklyDay } from '@gym-pilot/types'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'

const dayOptions: WeeklyDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function CreateAssignmentPage() {
  const { assignPlan } = usePlan()
  const navigate = useNavigate()
  const [personName, setPersonName] = useState('')
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<Record<string, WeeklyDay>>({})
  const [exerciseToAddId, setExerciseToAddId] = useState('')
  const [dayToAdd, setDayToAdd] = useState<WeeklyDay>('Monday')

  const handleAssignPlan = () => {
    if (!personName.trim() || selectedExerciseIds.length === 0) {
      return
    }

    assignPlan(personName, selectedExerciseIds, selectedDays)
    setPersonName('')
    setSelectedExerciseIds([])
    setSelectedDays({})
    setExerciseToAddId('')
    setDayToAdd('Monday')
    navigate('/assignments')
  }

  const handleExerciseSelection = (exerciseId: string, day: WeeklyDay = 'Monday') => {
    setSelectedExerciseIds((current) => (current.includes(exerciseId) ? current : [...current, exerciseId]))
    setSelectedDays((current) => ({ ...current, [exerciseId]: day }))
  }

  const handleDayChange = (exerciseId: string, day: WeeklyDay) => {
    setSelectedDays((current) => ({ ...current, [exerciseId]: day }))
  }

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExerciseIds((current) => current.filter((id) => id !== exerciseId))
    setSelectedDays((current) => {
      const next = { ...current }
      delete next[exerciseId]
      return next
    })
  }

  const getExercisesForDay = (day: WeeklyDay) =>
    selectedExerciseIds
      .map((exerciseId) => exercises.find((exercise) => exercise.id === exerciseId))
      .filter((exercise): exercise is (typeof exercises)[number] => Boolean(exercise))
      .filter((exercise) => selectedDays[exercise.id] === day)

  const handleAddExerciseToDay = () => {
    if (!exerciseToAddId) {
      return
    }

    handleExerciseSelection(exerciseToAddId, dayToAdd)
    setExerciseToAddId('')
    setDayToAdd('Monday')
  }

  return (
    <PageLayout>
      <PageCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Paragraph>Assignments</Paragraph>
            <Heading1 className="mt-2">Create a new assignment</Heading1>
          </div>
          <Link to="/assignments" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
            Back to assignments
          </Link>
        </div>

        <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              placeholder="Person name"
              className="min-w-56 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
            />
            <Button tone="emerald" onClick={handleAssignPlan} className="px-4 py-2">
              Create assignment
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Choose exercises from the library</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Pick exercises to add directly to this assignment.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <label className="flex min-w-64 flex-col gap-1 text-sm text-slate-600">
                  <span>Exercise</span>
                  <select
                    value={exerciseToAddId}
                    onChange={(event) => setExerciseToAddId(event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                  >
                    <option value="">Select an exercise</option>
                    {exercises.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm text-slate-600">
                  <span>Day</span>
                  <select
                    value={dayToAdd}
                    onChange={(event) => setDayToAdd(event.target.value as WeeklyDay)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                  >
                    {dayOptions.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </label>
                <Button tone="emerald" onClick={handleAddExerciseToDay} className="px-4 py-2">
                  Add to day
                </Button>
              </div>

              <div className="grid gap-3 xl:grid-cols-7">
                {dayOptions.map((day) => {
                  const dayExercises = getExercisesForDay(day)

                  return (
                    <div key={day} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{day}</h3>
                        <span className="text-xs text-slate-400">{dayExercises.length}</span>
                      </div>
                      <div className="space-y-2">
                        {dayExercises.length > 0 ? (
                          dayExercises.map((exercise) => (
                            <div key={exercise.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
                              <div className="flex items-start justify-between gap-2">
                                <span className="leading-5">{exercise.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExercise(exercise.id)}
                                  className="text-xs text-emerald-700 hover:text-emerald-900"
                                  aria-label={`Remove ${exercise.name}`}
                                >
                                  ✕
                                </button>
                              </div>
                              <select
                                value={selectedDays[exercise.id] ?? day}
                                onChange={(event) => handleDayChange(exercise.id, event.target.value as WeeklyDay)}
                                className="mt-2 w-full rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                              >
                                {dayOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ))
                        ) : (
                          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-400">
                            No exercises
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </PageCard>
    </PageLayout>
  )
}
