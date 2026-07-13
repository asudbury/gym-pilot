import { useMemo, useState } from 'react'
import type { PlanPart, PlanPartExerciseEntry, PlanPartWeek, WeeklyDay } from '@gym-pilot/types'
import { exercises, exercisesSchema, formatLabel } from '@gym-pilot/shared'
import { Button } from './Button'
import { ExerciseMetaBadges } from './ExerciseMetaBadges'
import { appTokens } from '../styles/tokens'

type WorkoutPlanEditorProps = {
  value: PlanPart[]
  onChange: (value: PlanPart[]) => void
  planItems: Array<{ id: string; name: string }>
}

const WEEKLY_DAYS: WeeklyDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function createWeekRows(count: number): PlanPartWeek[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `week-${index + 1}`,
    weekLabel: `Week ${index + 1}`,
    date: '',
  }))
}

function createExerciseEntry(planItems: Array<{ id: string; name: string }>): PlanPartExerciseEntry {
  return {
    id: `exercise-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    exerciseId: planItems[0]?.id ?? '',
    exerciseName: planItems[0]?.name ?? '',
    reps: '',
    workingSets: '',
    weekValues: {},
  }
}

function createPlanPart(day: WeeklyDay, weekCount: number, planItems: Array<{ id: string; name: string }>): PlanPart {
  return {
    id: `part-${day}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    day,
    planId: '',
    planName: '',
    weeks: createWeekRows(weekCount),
    exercises: [createExerciseEntry(planItems)],
  }
}

export function WorkoutPlanEditor({ value, onChange, planItems }: WorkoutPlanEditorProps) {
  const [weekCount, setWeekCount] = useState(4)
  const [activeExercisePicker, setActiveExercisePicker] = useState<{ partIndex: number; exerciseIndex: number } | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [pickerCategory, setPickerCategory] = useState('All')
  const [pickerEquipment, setPickerEquipment] = useState('All')

  const exerciseLibrary = useMemo(() => {
    const parsed = exercisesSchema.parse(exercises)

    return {
      items: parsed,
      categories: ['All', ...Array.from(new Set(parsed.map((exercise) => formatLabel(exercise.category))))],
      equipment: ['All', ...Array.from(new Set(parsed.map((exercise) => formatLabel(exercise.equipment))))],
    }
  }, [])

  const filteredExerciseLibrary = useMemo(() => {
    const normalizedSearch = pickerSearch.trim().toLowerCase()

    return exerciseLibrary.items.filter((exercise) => {
      const matchesCategory = pickerCategory === 'All' || formatLabel(exercise.category) === pickerCategory
      const matchesEquipment = pickerEquipment === 'All' || formatLabel(exercise.equipment) === pickerEquipment
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [exercise.name, exercise.category, exercise.target, exercise.equipment]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)

      return matchesCategory && matchesEquipment && matchesSearch
    })
  }, [exerciseLibrary.items, pickerCategory, pickerEquipment, pickerSearch])

  const parts = value

  const updatePart = (index: number, nextPart: PlanPart) => {
    const nextParts = [...parts]
    nextParts[index] = nextPart
    onChange(nextParts)
  }

  const syncWeekCount = (nextCount: number) => {
    const nextParts = parts.map((part) => ({
      ...part,
      weeks: part.weeks.length === nextCount ? part.weeks : createWeekRows(nextCount),
    }))
    onChange(nextParts)
  }

  const addPlanPart = () => {
    const usedDays = new Set(parts.map((part) => part.day))
    const nextDay = WEEKLY_DAYS.find((day) => !usedDays.has(day)) ?? WEEKLY_DAYS[0]
    onChange([...parts, createPlanPart(nextDay, weekCount, planItems)])
  }

  const removePlanPart = (partIndex: number) => {
    onChange(parts.filter((_, index) => index !== partIndex))
  }

  const addExercise = (partIndex: number) => {
    const nextPart = { ...parts[partIndex] }
    nextPart.exercises = [...nextPart.exercises, createExerciseEntry(planItems)]
    updatePart(partIndex, nextPart)
  }

  const updateExercise = (partIndex: number, exerciseIndex: number, key: keyof PlanPartExerciseEntry, value: string) => {
    const nextPart = { ...parts[partIndex] }
    const nextExercise = { ...nextPart.exercises[exerciseIndex] }
    nextExercise[key] = value as never
    nextPart.exercises = [...nextPart.exercises]
    nextPart.exercises[exerciseIndex] = nextExercise
    updatePart(partIndex, nextPart)
  }

  const openExercisePicker = (partIndex: number, exerciseIndex: number) => {
    setActiveExercisePicker({ partIndex, exerciseIndex })
    setPickerSearch('')
    setPickerCategory('All')
    setPickerEquipment('All')
  }

  const selectExerciseFromPicker = (exerciseId: string, exerciseName: string) => {
    if (!activeExercisePicker) {
      return
    }

    updateExercise(activeExercisePicker.partIndex, activeExercisePicker.exerciseIndex, 'exerciseId', exerciseId)
    updateExercise(activeExercisePicker.partIndex, activeExercisePicker.exerciseIndex, 'exerciseName', exerciseName)
    setActiveExercisePicker(null)
  }

  const updateWeekValue = (partIndex: number, exerciseIndex: number, weekId: string, value: string) => {
    const nextPart = { ...parts[partIndex] }
    const nextExercise = { ...nextPart.exercises[exerciseIndex] }
    nextExercise.weekValues = { ...nextExercise.weekValues, [weekId]: value }
    nextPart.exercises = [...nextPart.exercises]
    nextPart.exercises[exerciseIndex] = nextExercise
    updatePart(partIndex, nextPart)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">
          Number of weeks
          <input
            type="number"
            min="1"
            max="12"
            value={weekCount}
            onChange={(event) => {
              const nextCount = Number(event.target.value) || 1
              setWeekCount(nextCount)
              syncWeekCount(nextCount)
            }}
            className="ml-2 w-20 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          />
        </label>
        <Button tone="default" onClick={addPlanPart} className="px-3 py-2">
          Add plan part
        </Button>
      </div>

      {parts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
          No plan parts yet. Add one for any day you want to schedule.
        </div>
      ) : null}

      {parts.map((part, partIndex) => (
        <div key={part.id} className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">{part.day}</h3>
              <p className="mt-1 text-sm text-slate-600">Plan part for {part.day}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={part.day}
                  onChange={(event) => {
                    const nextPart = { ...parts[partIndex], day: event.target.value as WeeklyDay }
                    updatePart(partIndex, nextPart)
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  {WEEKLY_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
                <select
                  value={part.planId}
                  onChange={(event) => {
                    const selectedPlan = planItems.find((item) => item.id === event.target.value)
                    const nextPart = { ...parts[partIndex], planId: event.target.value, planName: selectedPlan?.name ?? '' }
                    updatePart(partIndex, nextPart)
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <option value="">Select a saved plan</option>
                  {planItems.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button tone="default" onClick={() => addExercise(partIndex)} className="px-3 py-2">
                Add exercise row
              </Button>
              <Button tone="rose" onClick={() => removePlanPart(partIndex)} className="px-3 py-2">
                Remove part
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-2 py-2">Exercise</th>
                  <th className="px-2 py-2">Reps</th>
                  <th className="px-2 py-2">Working sets</th>
                  {part.weeks.map((week) => (
                    <th key={week.id} className="min-w-32 px-2 py-2">
                      <div className="space-y-1">
                        <input
                          value={week.weekLabel}
                          onChange={(event) => {
                            const nextPart = { ...parts[partIndex] }
                            nextPart.weeks = nextPart.weeks.map((item) => (item.id === week.id ? { ...item, weekLabel: event.target.value } : item))
                            updatePart(partIndex, nextPart)
                          }}
                          className="w-full rounded-full border border-slate-200 px-2 py-1 text-xs"
                          placeholder="Week label"
                        />
                        <input
                          value={week.date}
                          onChange={(event) => {
                            const nextPart = { ...parts[partIndex] }
                            nextPart.weeks = nextPart.weeks.map((item) => (item.id === week.id ? { ...item, date: event.target.value } : item))
                            updatePart(partIndex, nextPart)
                          }}
                          className="w-full rounded-full border border-slate-200 px-2 py-1 text-xs"
                          placeholder="Date"
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {part.exercises.map((exercise, exerciseIndex) => (
                  <tr key={exercise.id} className={`${appTokens.surfaceSoft} rounded-2xl`}>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => openExercisePicker(partIndex, exerciseIndex)}
                        className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700"
                      >
                        {exercise.exerciseName || 'Choose exercise'}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={exercise.reps}
                        onChange={(event) => updateExercise(partIndex, exerciseIndex, 'reps', event.target.value)}
                        className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        placeholder="Reps"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={exercise.workingSets}
                        onChange={(event) => updateExercise(partIndex, exerciseIndex, 'workingSets', event.target.value)}
                        className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        placeholder="Working sets"
                      />
                    </td>
                    {part.weeks.map((week) => (
                      <td key={`${exercise.id}-${week.id}`} className="px-2 py-2">
                        <input
                          value={exercise.weekValues[week.id] ?? ''}
                          onChange={(event) => updateWeekValue(partIndex, exerciseIndex, week.id, event.target.value)}
                          className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                          placeholder="Value"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {activeExercisePicker ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 px-3 py-4 sm:px-6">
          <div className="w-full max-w-6xl rounded-[32px] border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Pick an exercise</h3>
                <p className="mt-1 text-sm text-slate-600">Choose an exercise from the full library for this plan row.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveExercisePicker(null)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <input
                type="text"
                value={pickerSearch}
                onChange={(event) => setPickerSearch(event.target.value)}
                placeholder="Search exercises"
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              />

              <div className="flex flex-wrap items-center gap-3">
                {exerciseLibrary.categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setPickerCategory(category)}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      pickerCategory === category
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
                {exerciseLibrary.equipment.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPickerEquipment(item)}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      pickerEquipment === item
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {filteredExerciseLibrary.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => selectExerciseFromPicker(exercise.id, exercise.name)}
                    className="flex w-full items-start justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{formatLabel(exercise.name)}</div>
                      <ExerciseMetaBadges
                        values={[formatLabel(exercise.category), formatLabel(exercise.equipment)]}
                        tones={['blue', 'orange']}
                        className="mt-2"
                        pillClassName="text-xs"
                      />
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">
                      Choose
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
