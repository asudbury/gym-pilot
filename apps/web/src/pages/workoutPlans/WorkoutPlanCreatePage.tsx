import { getSupabaseClient } from '@gym-pilot/shared'
import { TableNames } from '@gym-pilot/shared/src/dataServices/tableNames'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ItemControls } from '../../components/ItemControls'
import { PageCard } from '../../components/PageCard'
import { Heading1, Paragraph } from '../../components/Typography'
import BackLink from '../../components/ui/BackLink'
import { Button } from '../../components/ui/Button'
import { DecorativeIcon } from '../../components/ui/DecorativeIcon'
import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification'
import { WorkoutTemplatePickerModal } from '../../components/WorkoutTemplatePickerModal'
import { PageLayout } from '../../layouts/PageLayout'
import { formatLabel } from '../../utils/formatUtils'
import { useIsDesktop } from '../../utils/useMediaQuery'

// --- Types (These types are defined locally for this new feature. In a larger project,
// they would typically be moved to a shared types package like `@gym-pilot/types`.) ---
interface PlanItem {
  id: string // UUID for this specific plan item instance
  exercise_id: string
  exercise_name: string
  position: number
  reps?: string
  sets?: string
  notes?: string
}

interface PlanSession {
  id: string // UUID for this specific plan session instance (e.g., a day/tab)
  name: string // e.g., "Day 1", "Monday"
  planItems: PlanItem[]
}

interface WorkoutTemplate {
  id: string
  name: string
  description: string | null
  workout_template_exercise: {
    id: string // ID of the workout_template_exercise row
    template_id: string
    exercise_id: string
    exercise_name: string
    position: number
  }[]
}
// --- End Types ---

// Helper to generate UUIDs
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Reorder utility (copied from WorkoutTemplateCreatePage for consistency)
function reorder<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const currentIndex = index

  if (currentIndex < 0) {
    return items
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const [currentItem] = nextItems.splice(currentIndex, 1)
  nextItems.splice(targetIndex, 0, currentItem)

  return nextItems
}

export default function WorkoutPlanCreatePage() {
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const [planName, setPlanName] = useState('')
  const [planDescription, setPlanDescription] = useState('')
  const [planSessions, setPlanSessions] = useState<PlanSession[]>([
    { id: generateUUID(), name: 'Day 1', planItems: [] },
  ])
  const [activeSessionIndex, setActiveSessionIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [movedItem, setMovedItem] = useState<string | null>(null) // For exercise reorder animation
  const [movedSession, setMovedSession] = useState<string | null>(null) // For session reorder animation

  const activeSession = planSessions[activeSessionIndex]

  // Effect for exercise reorder animation cleanup
  useEffect(() => {
    if (movedItem) {
      const timer = setTimeout(() => setMovedItem(null), 500)
      return () => clearTimeout(timer)
    }
  }, [movedItem])

  // Effect for session reorder animation cleanup
  useEffect(() => {
    if (movedSession) {
      const timer = setTimeout(() => setMovedSession(null), 500)
      return () => clearTimeout(timer)
    }
  }, [movedSession])

  const handleAddSession = () => {
    setPlanSessions((prev) => [
      ...prev,
      { id: generateUUID(), name: `Day ${prev.length + 1}`, planItems: [] },
    ])
    setActiveSessionIndex(planSessions.length) // Activate the new session
  }

  const handleRemoveSession = (indexToRemove: number) => {
    if (planSessions.length === 1) {
      setError('A plan must have at least one session.')
      return
    }
    setPlanSessions((prev) => prev.filter((_, idx) => idx !== indexToRemove))
    // Adjust active session index if the removed session was active or if it affects the active index
    if (activeSessionIndex >= indexToRemove && activeSessionIndex > 0) {
      setActiveSessionIndex(activeSessionIndex - 1)
    } else if (activeSessionIndex === 0 && planSessions.length > 1) {
      setActiveSessionIndex(0) // Stay on the first if it's the only one left
    }
  }

  const handleReorderSession = (index: number, direction: 'up' | 'down') => {
    setPlanSessions((prev) => {
      const reordered = reorder(prev, index, direction)
      const moved = reordered[direction === 'up' ? index - 1 : index + 1]
      if (moved) {
        setMovedSession(moved.id)
      }
      // Adjust active session index if the active session was moved
      if (index === activeSessionIndex) {
        setActiveSessionIndex(direction === 'up' ? index - 1 : index + 1)
      } else if (direction === 'up' && index - 1 === activeSessionIndex) {
        setActiveSessionIndex(activeSessionIndex + 1)
      } else if (direction === 'down' && index + 1 === activeSessionIndex) {
        setActiveSessionIndex(activeSessionIndex - 1)
      }
      return reordered
    })
  }

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    if (!activeSession) return

    const newPlanItems: PlanItem[] = template.workout_template_exercise.map(
      (ex, idx) => ({
        id: generateUUID(),
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name,
        position: activeSession.planItems.length + idx, // Append to current items and set position
        // Add other fields from workout_template_exercise if they exist and are relevant for PlanItem
      }),
    )

    setPlanSessions((prev) =>
      prev.map((session, idx) =>
        idx === activeSessionIndex
          ? {
              ...session,
              planItems: [...session.planItems, ...newPlanItems],
            }
          : session,
      ),
    )
    setShowTemplatePicker(false)
  }

  const handleRemovePlanItem = (sessionIndex: number, itemIndex: number) => {
    setPlanSessions((prev) =>
      prev.map((session, sIdx) =>
        sIdx === sessionIndex
          ? {
              ...session,
              planItems: session.planItems.filter(
                (_, iIdx) => iIdx !== itemIndex,
              ),
            }
          : session,
      ),
    )
  }

  const handleReorderPlanItem = (
    sessionIndex: number,
    itemIndex: number,
    direction: 'up' | 'down',
  ) => {
    setPlanSessions((prev) =>
      prev.map((session, sIdx) => {
        if (sIdx === sessionIndex) {
          const reorderedItems = reorder(
            session.planItems,
            itemIndex,
            direction,
          )
          const moved =
            reorderedItems[direction === 'up' ? itemIndex - 1 : itemIndex + 1]
          if (moved) {
            setMovedItem(moved.id)
          }
          return { ...session, planItems: reorderedItems }
        }
        return session
      }),
    )
  }

  const handleSavePlan = async () => {
    if (!planName.trim()) {
      setError('Plan name is required.')
      return
    }
    if (planSessions.every((session) => session.planItems.length === 0)) {
      setError('Plan must contain at least one exercise across all sessions.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const client = getSupabaseClient()
      if (!client) {
        setError('Supabase client not available.')
        setIsSaving(false)
        return
      }

      const { data: authData, error: authErr } = await client.auth.getUser()
      if (authErr || !authData?.user) {
        setError('Unable to determine current user for plan save.')
        setIsSaving(false)
        return
      }

      const planSlug = planName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-*|-*$/g, '')

      // Create the plan row (no plan_sessions JSON). We'll insert exercises separately.
      const { data: createdPlan, error: createPlanError } = await client
        .from(TableNames.WorkoutPlan)
        .insert({
          user_id: authData.user.id,
          plan_name: planName.trim(),
          plan_slug: planSlug,
        })
        .select('id')
        .maybeSingle()

      if (createPlanError || !createdPlan?.id) {
        setError(createPlanError?.message || 'Failed to create plan')
        setIsSaving(false)
        return
      }

      const planId = createdPlan.id

      // Flatten sessions -> exercises and insert into workout_plan_exercise
      const exercisesToInsert: Array<any> = []
      let positionCounter = 0
      planSessions.forEach((session) => {
        session.planItems.forEach((item) => {
          exercisesToInsert.push({
            id: generateUUID(),
            plan_id: planId,
            exercise_id: item.exercise_id,
            exercise_name: item.exercise_name,
            position: positionCounter++,
            details: {},
          })
        })
      })

      if (exercisesToInsert.length > 0) {
        const { error: insertExercisesError } = await client
          .from(TableNames.WorkoutPlanExercise)
          .insert(exercisesToInsert)

        if (insertExercisesError) {
          setError(insertExercisesError.message)
          setIsSaving(false)
          return
        }
      }

      navigate('/workout-plans') // Navigate to the plans list page after successful save
    } catch (err: any) {
      console.error('Error saving plan:', err)
      setError(
        err.message || 'An unexpected error occurred while saving the plan.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageLayout className="max-w-4xl">
      <PageCard padding="spacious">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <DecorativeIcon icon="clipboard" />
            <div>
              <Paragraph>Workout Plans</Paragraph>
              <Heading1 className="mt-2">Create Plan</Heading1>
            </div>
          </div>
          <BackLink />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Plan name
            </label>
            <input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g. 4-Week Strength Program"
            />
            <label className="block text-sm font-medium text-slate-700 mt-3">
              Description (optional)
            </label>
            <input
              value={planDescription}
              onChange={(e) => setPlanDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Notes about this plan"
            />
          </div>

          {/* Plan Sessions (Days/Tabs) */}
          <div className="mt-4">
            <h3 className="text-sm font-medium">Plan Sessions (Days)</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {planSessions.map((session, sIdx) => (
                <div
                  key={session.id}
                  className={clsx(
                    'flex items-center gap-2 rounded-md border p-2 transition-colors',
                    {
                      'bg-blue-100': movedSession === session.id,
                      'border-blue-500 bg-blue-50': sIdx === activeSessionIndex,
                    },
                  )}
                >
                  <Button
                    tone="chip"
                    onClick={() => setActiveSessionIndex(sIdx)}
                    className={clsx({
                      'bg-blue-500 text-white hover:bg-blue-600':
                        sIdx === activeSessionIndex,
                    })}
                  >
                    {session.name}
                  </Button>
                  <ItemControls
                    itemName={session.name}
                    onRemove={() => handleRemoveSession(sIdx)}
                    onReorder={(direction) =>
                      handleReorderSession(sIdx, direction)
                    }
                    isFirst={sIdx === 0}
                    isLast={sIdx === planSessions.length - 1}
                    removeText={false} // Keep icons for sessions
                    className="flex items-center gap-1"
                  />
                </div>
              ))}
              <Button tone="default" onClick={handleAddSession}>
                Add Day
              </Button>
            </div>

            {activeSession ? (
              <div className="mt-4 p-4 border rounded-md bg-slate-50">
                <h4 className="text-md font-semibold mb-3">
                  Exercises for {activeSession.name}
                </h4>
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    tone="blue"
                    onClick={() => setShowTemplatePicker(true)}
                  >
                    Add Exercises from Template
                  </Button>
                  <Button
                    tone="default"
                    onClick={() => {
                      setPlanSessions((prev) =>
                        prev.map((s, idx) =>
                          idx === activeSessionIndex
                            ? { ...s, planItems: [] }
                            : s,
                        ),
                      )
                    }}
                  >
                    Clear Exercises
                  </Button>
                </div>

                {activeSession.planItems.length === 0 ? (
                  <p className="text-slate-500">
                    No exercises in this session. Add some from a template.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {activeSession.planItems.map((item, iIdx) => (
                      <li
                        key={item.id}
                        className={clsx(
                          'flex flex-col gap-2 rounded-md border p-2 transition-colors sm:flex-row sm:items-center sm:justify-between',
                          {
                            'bg-blue-100': movedItem === item.id,
                          },
                        )}
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {formatLabel(item.exercise_name)}
                        </span>
                        <ItemControls
                          itemName={item.exercise_name}
                          onRemove={() =>
                            handleRemovePlanItem(activeSessionIndex, iIdx)
                          }
                          onReorder={(direction) =>
                            handleReorderPlanItem(
                              activeSessionIndex,
                              iIdx,
                              direction,
                            )
                          }
                          isFirst={iIdx === 0}
                          isLast={iIdx === activeSession.planItems.length - 1}
                          removeText={isDesktop}
                          className="flex items-center justify-end gap-2"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No sessions available. Add a new day to start.
              </p>
            )}
          </div>

          {error ? (
            <StatusMessageNotification
              message={error}
              tone="error"
              className="mt-2"
            />
          ) : null}
        </div>
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              tone="emerald"
              className="w-fit rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={handleSavePlan}
              disabled={
                isSaving ||
                !planName.trim() ||
                planSessions.every((session) => session.planItems.length === 0)
              }
            >
              {isSaving ? 'Saving...' : 'Save Plan'}
            </Button>
            <Button tone="default" onClick={() => navigate('/workout-plans')}>
              Cancel
            </Button>
          </div>
        </div>

        <WorkoutTemplatePickerModal
          isOpen={showTemplatePicker}
          onSelectTemplate={handleSelectTemplate}
          onCancel={() => setShowTemplatePicker(false)}
        />
      </PageCard>
    </PageLayout>
  )
}
