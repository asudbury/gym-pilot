import {
  addSessionWorkoutItem,
  normalizeSessionWorkoutCategory,
  removeSessionWorkoutItem,
  reorderSessionWorkoutItem,
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

export function SessionWorkoutEditor({
  items,
  onChange,
  className = '',
}: SessionWorkoutEditorProps) {
  return (
    <div
      className={`space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 ${className}`.trim()}
    >
      {items.length === 0 ? (
        <p className="text-sm text-slate-600">
          Select a plan or assignment to prefill workout items, or add them
          manually below.
        </p>
      ) : null}

      {items.map((item, index) => (
        <div
          key={item.id}
          className="rounded-2xl border border-slate-200 bg-white p-3"
        >
          <div className="flex flex-wrap items-center gap-2">
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
              className={`${appTokens.input} min-w-8`}
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
              onClick={() => onChange(removeSessionWorkoutItem(items, item.id))}
            >
              Remove
            </Button>
          </div>

          {item.category === 'exercise' && item.exerciseId ? (
            <div className="mt-2">
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

          <div className="mt-2 grid gap-2 md:grid-cols-2">
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
      ))}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          tone="default"
          onClick={() =>
            onChange(
              addSessionWorkoutItem(items, {
                category: 'exercise',
                exerciseName: '',
                reps: '',
                sets: '',
                notes: '',
              }),
            )
          }
        >
          Add item
        </Button>
      </div>
    </div>
  )
}
