import { useState } from 'react'
import {
  addSessionWorkoutItem,
  normalizeSessionWorkoutCategory,
  removeSessionWorkoutItem,
  reorderSessionWorkoutItem,
  summarizeSessionWorkoutItem,
  updateSessionWorkoutItem,
  type SessionWorkoutItem,
} from '@gym-pilot/shared'
import { Button } from './Button'
import { ExerciseSearchPicker } from './exercises/ExerciseSearchPicker'
import { appTokens } from '../constants/tokens'
import { formatLabel } from '../utils/formatUtils'
import { getExercisePath } from '../utils/exerciseRouteUtils'

type SessionWorkoutEditorProps = {
  items: SessionWorkoutItem[]
  onChange: (items: SessionWorkoutItem[]) => void
  className?: string
}

export function resolveExpandedWorkoutItemId(
  items: SessionWorkoutItem[],
  activeItemId: string | null,
) {
  if (items.length === 0) {
    return null
  }

  if (activeItemId && items.some((item) => item.id === activeItemId)) {
    return activeItemId
  }

  return items[0]?.id ?? null
}

export function SessionWorkoutEditor({
  items,
  onChange,
  className = '',
}: SessionWorkoutEditorProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(() =>
    resolveExpandedWorkoutItemId(items, null),
  )
  const [draftExerciseName, setDraftExerciseName] = useState('')
  const [draftSets, setDraftSets] = useState('')
  const [draftReps, setDraftReps] = useState('')

  const handleExpandItem = (itemId: string) => {
    setExpandedItemId((current) => (current === itemId ? null : itemId))
  }

  const handleAddItem = () => {
    const nextItems = addSessionWorkoutItem(items, {
      category: 'exercise',
      exerciseName: draftExerciseName.trim() || '',
      reps: draftReps.trim() || '',
      sets: draftSets.trim() || '',
      notes: '',
    })

    onChange(nextItems)
    setExpandedItemId(nextItems[nextItems.length - 1]?.id ?? null)
    setDraftExerciseName('')
    setDraftSets('')
    setDraftReps('')
  }

  return (
    <div
      className={`space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 ${className}`.trim()}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex-1" data-testid="quick-add-exercise-picker">
            <ExerciseSearchPicker
              id="quick-add-exercise-picker"
              label="Quick add exercise"
              value={draftExerciseName}
              placeholder="Quick add exercise"
              className="w-full"
              onChange={(nextValue) => setDraftExerciseName(nextValue)}
              onSelectExercise={(exercise) => {
                setDraftExerciseName(formatLabel(exercise.name))
              }}
            />
          </div>
          <div className="flex gap-2">
            <input
              value={draftSets}
              onChange={(event) => setDraftSets(event.target.value)}
              placeholder="Sets"
              className={`${appTokens.input} w-20`}
            />
            <input
              value={draftReps}
              onChange={(event) => setDraftReps(event.target.value)}
              placeholder="Reps"
              className={`${appTokens.input} w-20`}
            />
          </div>
          <Button type="button" tone="default" onClick={handleAddItem}>
            Add item
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-600">
          Select a plan or assignment to prefill workout items, or add them
          manually below.
        </p>
      ) : null}

      {items.map((item, index) => {
        const isExpanded = expandedItemId === item.id

        return (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-3"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-2">
                <Button
                  type="button"
                  tone="default"
                  className="px-2 py-1 text-xs"
                  onClick={() => handleExpandItem(item.id)}
                  aria-label={isExpanded ? 'Collapse item' : 'Expand item'}
                >
                  {isExpanded ? '−' : '+'}
                </Button>
                <Button
                  type="button"
                  tone="default"
                  className="px-2 py-1 text-xs"
                  onClick={() => handleExpandItem(item.id)}
                >
                  Edit details
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-800">
                    {item.exerciseName?.trim() || 'Untitled item'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {summarizeSessionWorkoutItem(item) || 'Tap to add details'}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Button
                  type="button"
                  tone="default"
                  className="px-2 py-1 text-xs"
                  onClick={() =>
                    onChange(reorderSessionWorkoutItem(items, item.id, 'up'))
                  }
                  disabled={index === 0}
                  aria-label={`Move ${item.exerciseName || 'item'} up`}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  tone="default"
                  className="px-2 py-1 text-xs"
                  onClick={() =>
                    onChange(reorderSessionWorkoutItem(items, item.id, 'down'))
                  }
                  disabled={index === items.length - 1}
                  aria-label={`Move ${item.exerciseName || 'item'} down`}
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  tone="destructive"
                  onClick={() =>
                    onChange(removeSessionWorkoutItem(items, item.id))
                  }
                >
                  Remove
                </Button>
              </div>
            </div>

            {isExpanded ? (
              <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-col gap-2 md:flex-row">
                  <select
                    value={item.category}
                    onChange={(event) => {
                      onChange(
                        updateSessionWorkoutItem(items, item.id, {
                          category: normalizeSessionWorkoutCategory(
                            event.target.value,
                          ),
                        }),
                      )
                    }}
                    className={`${appTokens.input} md:min-w-32`}
                  >
                    <option value="exercise">Exercise</option>
                    <option value="warm_up">Warm up</option>
                    <option value="stretch">Stretch</option>
                    <option value="cool_down">Cool down</option>
                    <option value="run">Run</option>
                    <option value="spin">Spin</option>
                  </select>
                  {item.category === 'exercise' ? (
                    <ExerciseSearchPicker
                      label="Find exercise"
                      value={item.exerciseName}
                      placeholder="Exercise or activity"
                      className="flex-1 min-w-12"
                      onChange={(nextValue) => {
                        onChange(
                          updateSessionWorkoutItem(items, item.id, {
                            exerciseName: nextValue,
                            exerciseId: '',
                          }),
                        )
                      }}
                      onSelectExercise={(exercise) => {
                        onChange(
                          updateSessionWorkoutItem(items, item.id, {
                            exerciseName: formatLabel(exercise.name),
                            exerciseId: exercise.id,
                          }),
                        )
                      }}
                    />
                  ) : (
                    <input
                      value={item.exerciseName}
                      onChange={(event) => {
                        onChange(
                          updateSessionWorkoutItem(items, item.id, {
                            exerciseName: event.target.value,
                          }),
                        )
                      }}
                      placeholder="Exercise or activity"
                      className={`${appTokens.input} flex-1 min-w-12`}
                    />
                  )}
                </div>

                {item.category === 'exercise' && item.exerciseId ? (
                  <div>
                    <a
                      href={getExercisePath({
                        id: item.exerciseId,
                        name: item.exerciseName,
                      })}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-emerald-700 underline decoration-emerald-600/50 underline-offset-2"
                    >
                      Open exercise card
                    </a>
                  </div>
                ) : null}

                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    value={item.sets ?? ''}
                    onChange={(event) => {
                      onChange(
                        updateSessionWorkoutItem(items, item.id, {
                          sets: event.target.value,
                        }),
                      )
                    }}
                    placeholder="Sets"
                    className={`${appTokens.input}`}
                  />
                  <input
                    value={item.reps ?? ''}
                    onChange={(event) => {
                      onChange(
                        updateSessionWorkoutItem(items, item.id, {
                          reps: event.target.value,
                        }),
                      )
                    }}
                    placeholder="Reps"
                    className={`${appTokens.input}`}
                  />
                  <input
                    value={item.weight ?? ''}
                    onChange={(event) => {
                      onChange(
                        updateSessionWorkoutItem(items, item.id, {
                          weight: event.target.value,
                        }),
                      )
                    }}
                    placeholder="Weight"
                    className={`${appTokens.input}`}
                  />
                  <input
                    value={item.durationMinutes ?? ''}
                    onChange={(event) => {
                      onChange(
                        updateSessionWorkoutItem(items, item.id, {
                          durationMinutes: event.target.value,
                        }),
                      )
                    }}
                    placeholder="Duration (mins)"
                    className={`${appTokens.input}`}
                  />
                  <input
                    value={item.distanceKm ?? ''}
                    onChange={(event) => {
                      onChange(
                        updateSessionWorkoutItem(items, item.id, {
                          distanceKm: event.target.value,
                        }),
                      )
                    }}
                    placeholder="Distance (km)"
                    className={`${appTokens.input}`}
                  />
                  <input
                    value={item.speedKph ?? ''}
                    onChange={(event) => {
                      onChange(
                        updateSessionWorkoutItem(items, item.id, {
                          speedKph: event.target.value,
                        }),
                      )
                    }}
                    placeholder="Speed (km/h)"
                    className={`${appTokens.input}`}
                  />
                </div>

                <textarea
                  value={item.notes ?? ''}
                  onChange={(event) => {
                    onChange(
                      updateSessionWorkoutItem(items, item.id, {
                        notes: event.target.value,
                      }),
                    )
                  }}
                  rows={2}
                  placeholder="Notes"
                  className={`${appTokens.input} mt-2 w-full`}
                />
              </div>
            ) : null}
          </div>
        )
      })}

      <div className="flex flex-wrap gap-2">
        <Button type="button" tone="default" onClick={handleAddItem}>
          Add item
        </Button>
      </div>
    </div>
  )
}
