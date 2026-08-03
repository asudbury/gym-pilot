import { type UserSessionWorkoutItem } from '@gym-pilot/shared'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { appTokens } from '../constants/tokens'
import { formatLabel } from '../utils/formatUtils'
import { useIsDesktop } from '../utils/useMediaQuery'
import { ExerciseMultiPicker } from './exercises/ExerciseMultiPicker'
import { ItemControls } from './ItemControls'
import { Button } from './ui/Button'

function createUuid() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (char) =>
    (
      Number(char) ^
      ((crypto.getRandomValues(new Uint8Array(1))[0] & 15) >>
        (Number(char) / 4))
    ).toString(16),
  )
}

export function createSessionWorkoutItemId() {
  return createUuid()
}

function addSessionWorkoutItems(
  items: Partial<UserSessionWorkoutItem>[],
  newItems: Partial<UserSessionWorkoutItem>[],
): Partial<UserSessionWorkoutItem>[] {
  const newWorkoutItems = newItems.map((item) => ({
    id: createSessionWorkoutItemId(),
    ...item,
  }))
  return [...items, ...newWorkoutItems]
}

function removeSessionWorkoutItem(
  items: Partial<UserSessionWorkoutItem>[],
  index: number,
): Partial<UserSessionWorkoutItem>[] {
  return items.filter((_, i) => i !== index)
}

function reorderSessionWorkoutItem(
  items: Partial<UserSessionWorkoutItem>[],
  index: number,
  direction: 'up' | 'down',
): Partial<UserSessionWorkoutItem>[] {
  const newItems = [...items]
  const [movedItem] = newItems.splice(index, 1)
  const newIndex = direction === 'up' ? index - 1 : index + 1
  newItems.splice(newIndex, 0, movedItem)
  return newItems
}

function updateSessionWorkoutItem(
  items: Partial<UserSessionWorkoutItem>[],
  itemId: string,
  updates: Partial<UserSessionWorkoutItem>,
): Partial<UserSessionWorkoutItem>[] {
  return items.map((item) =>
    item.id === itemId ? { ...item, ...updates } : item,
  )
}

type SessionWorkoutEditorProps = {
  items: Partial<UserSessionWorkoutItem>[]
  onChange: (items: Partial<UserSessionWorkoutItem>[]) => void
  className?: string
}

export function resolveExpandedWorkoutItemId(
  items: Partial<UserSessionWorkoutItem>[],
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
  const isDesktop = useIsDesktop()
  const [expandedItemId, setExpandedItemId] = useState<string | null>(() =>
    resolveExpandedWorkoutItemId(items, null),
  )
  const [moved, setMoved] = useState<string | null>(null)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [showEditExercisePicker, setShowEditExercisePicker] = useState<
    string | null
  >(null)

  useEffect(() => {
    if (moved) {
      const timer = setTimeout(() => {
        setMoved(null)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [moved])

  const handleExpandItem = (itemId: string) => {
    setExpandedItemId((current) => (current === itemId ? null : itemId))
  }

  return (
    <div
      className={`space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 ${className}`}
    >
      <div className="flex-1" data-testid="quick-add-exercise-picker">
        <Button tone="blue" onClick={() => setShowExercisePicker(true)}>
          Add Exercises
        </Button>
        <ExerciseMultiPicker
          isOpen={showExercisePicker}
          onSelectExercises={(exercises) => {
            const newItems = addSessionWorkoutItems(
              items,
              exercises.map((exercise) => ({
                category: 'exercise',
                exercise_name: formatLabel(exercise.name),
                exercise_id: exercise.id,
              })),
            )
            onChange(newItems)
            setShowExercisePicker(false)
          }}
          onCancel={() => setShowExercisePicker(false)}
        />
      </div>

      {items.map((item, index) => {
        const isExpanded = expandedItemId === item.id

        return (
          <div
            key={item.id}
            className={clsx(
              'rounded-2xl border border-slate-200 bg-white p-3 transition-colors',
              {
                'bg-yellow-100': moved === item.id,
              },
            )}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex flex-1 items-center gap-2">
                <Button
                  tone="default"
                  className="px-2 py-1 text-xs"
                  onClick={() => handleExpandItem(item.id!)}
                  aria-label={isExpanded ? 'Collapse item' : 'Expand item'}
                >
                  {isExpanded ? '−' : '+'}
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-800">
                    {item.exercise_name?.trim() || 'Untitled item'}
                  </div>
                </div>
              </div>
              <ItemControls
                itemName={item.exercise_name || 'item'}
                onRemove={() =>
                  onChange(removeSessionWorkoutItem(items, index))
                }
                onReorder={(direction) => {
                  const reorderedItems = reorderSessionWorkoutItem(
                    items,
                    index,
                    direction,
                  )
                  const movedItem =
                    reorderedItems[direction === 'up' ? index - 1 : index + 1]
                  if (movedItem) {
                    setMoved(movedItem.id!)
                  }
                  onChange(reorderedItems)
                }}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                removeText={isDesktop}
              />
            </div>

            {isExpanded ? (
              <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-col gap-2 md:flex-row">
                  {item.category === 'exercise' ? (
                    <>
                      <ExerciseMultiPicker
                        isOpen={showEditExercisePicker === item.id}
                        onSelectExercises={(exercises) => {
                          const newItems = exercises.map((exercise) => ({
                            category: 'exercise' as const,
                            exercise_name: formatLabel(exercise.name),
                            exercise_id: exercise.id,
                          }))
                          const itemsWithoutOld = removeSessionWorkoutItem(
                            items,
                            index,
                          )
                          const finalItems = addSessionWorkoutItems(
                            itemsWithoutOld,
                            newItems,
                          )
                          onChange(finalItems)
                          setExpandedItemId(
                            finalItems[finalItems.length - 1]?.id ?? null,
                          )
                          setShowEditExercisePicker(null)
                        }}
                        onCancel={() => setShowEditExercisePicker(null)}
                      />
                    </>
                  ) : (
                    <input
                      value={item.exercise_name || ''}
                      onChange={(event) => {
                        onChange(
                          updateSessionWorkoutItem(items, item.id!, {
                            exercise_name: event.target.value,
                          }),
                        )
                      }}
                      placeholder="Exercise or activity"
                      className={`${appTokens.input} flex-1 min-w-12`}
                    />
                  )}
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    value={item.sets ?? ''}
                    onChange={(event) => {
                      onChange(
                        updateSessionWorkoutItem(items, item.id!, {
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
                        updateSessionWorkoutItem(items, item.id!, {
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
                        updateSessionWorkoutItem(items, item.id!, {
                          weight: event.target.value,
                        }),
                      )
                    }}
                    placeholder="Weight"
                    className={`${appTokens.input}`}
                  />
                  <input
                    value={item.duration_minutes ?? ''}
                    onChange={(event) => {
                      onChange(
                        updateSessionWorkoutItem(items, item.id!, {
                          duration_minutes: event.target.value,
                        }),
                      )
                    }}
                    placeholder="Duration (mins)"
                    className={`${appTokens.input}`}
                  />
                  <input
                    value={item.distance_km ?? ''}
                    onChange={(event) => {
                      onChange(
                        updateSessionWorkoutItem(items, item.id!, {
                          distance_km: event.target.value,
                        }),
                      )
                    }}
                    placeholder="Distance (km)"
                    className={`${appTokens.input}`}
                  />
                  <input
                    value={item.speed_kph ?? ''}
                    onChange={(event) => {
                      onChange(
                        updateSessionWorkoutItem(items, item.id!, {
                          speed_kph: event.target.value,
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
                      updateSessionWorkoutItem(items, item.id!, {
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
    </div>
  )
}
