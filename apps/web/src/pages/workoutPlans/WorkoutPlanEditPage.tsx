import { logger } from '@gym-pilot/shared'
import type {
  Tables,
} from '@gym-pilot/shared/src/dataServices/databaseTypes'
import { TableNames } from '@gym-pilot/shared/src/dataServices/tableNames'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ItemControls } from '../../components/ItemControls'
import { PageCard } from '../../components/PageCard'
import { Heading1, Paragraph } from '../../components/Typography'
import { BackLink } from '../../components/ui/BackLink'
import { Button } from '../../components/ui/Button'
import { DecorativeIcon } from '../../components/ui/DecorativeIcon'
import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification'
import { WorkoutTemplatePickerModal } from '../../components/WorkoutTemplatePickerModal'
import { PageLayout } from '../../layouts/PageLayout'
import { formatLabel } from '../../utils/formatUtils'
import { useIsDesktop } from '../../utils/useMediaQuery'
import { reorder } from '../../utils/arrayUtils'
import {
  copyWorkoutPlan,
  deleteWorkoutPlan,
  loadWorkoutPlan,
  persistWorkoutPlan,
} from '../../features/workoutPlans/services/workoutPlansService'

type PlanItem = Tables<typeof TableNames.WorkoutPlanExercise> & {
  exercise_name?: string | null
  session_id?: string | null
}

type PlanSession = Tables<typeof TableNames.WorkoutPlanSession> & {
  planItems: PlanItem[]
}

function createPlanSession(id: string, name: string): PlanSession {
  const now = new Date().toISOString()

  return {
    id,
    name,
    created_at: now,
    plan_id: '',
    position: 0,
    updated_at: now,
    planItems: [],
  }
}

type WorkoutTemplate = Tables<typeof TableNames.WorkoutTemplate> & {
  workout_template_exercise: Array<
    Tables<typeof TableNames.WorkoutTemplateExercise>
  >
}

export default function WorkoutPlanEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isDesktop = useIsDesktop()
  const isEditMode = Boolean(id)

  const [planName, setPlanName] = useState('')
  const [planDescription, setPlanDescription] = useState('')
  const [planSessions, setPlanSessions] = useState<PlanSession[]>([
    createPlanSession(crypto.randomUUID(), 'Session 1'),
  ])
  const [activeSessionIndex, setActiveSessionIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [movedItem, setMovedItem] = useState<string | null>(null) // For exercise reorder animation
  const [movedSession, setMovedSession] = useState<string | null>(null) // For session reorder animation
  const [isLoadingPlan, setIsLoadingPlan] = useState(isEditMode)
  const [pendingDelete, setPendingDelete] = useState(false)

  const activeSession = planSessions[activeSessionIndex]

  useEffect(() => {
    if (!isEditMode || !id) {
      setIsLoadingPlan(false)
      return
    }

    void loadWorkoutPlan(id).then(({ data, error }) => {
      if (error || !data) {
        setError(error ?? 'Failed to load plan for editing.')
      } else {
        setPlanName(data.planName)
        setPlanSessions(data.sessions)
        setActiveSessionIndex(0)
      }
      setIsLoadingPlan(false)
    })
  }, [id, isEditMode])

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
      createPlanSession(crypto.randomUUID(), `Session ${prev.length + 1}`),
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

  const handleSessionNameChange = (newName: string) => {
    setPlanSessions((prev) =>
      prev.map((session, idx) =>
        idx === activeSessionIndex
          ? { ...session, name: newName.trim() } // Trim name as it's updated
          : session,
      ),
    )
  }

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    if (!activeSession) return

    const newPlanItems: PlanItem[] = template.workout_template_exercise.map(
      (ex, idx) => ({
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        plan_id: '',
        exercise_id: ex.exercise_id,
        exercise_name: ex.exercise_name ?? '',
        position: activeSession.planItems.length + idx,
        session_id: activeSession.id,
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

  const callPersistService = async (
    sessionsToPersist: PlanSession[],
  ): Promise<string | null> => {
    const { planId: resolvedPlanId, error: persistError } = await persistWorkoutPlan({
      planId: id,
      planName,
      isEditMode,
      sessions: sessionsToPersist,
    })
    if (persistError) {
      setError(persistError)
      return null
    }
    return resolvedPlanId
  }

  const handleClearActiveSessionExercises = async () => {
    const nextSessions = planSessions.map((session, idx) =>
      idx === activeSessionIndex ? { ...session, planItems: [] } : session,
    )
    setPlanSessions(nextSessions)

    if (!isEditMode || !id) {
      return
    }

    const { error: persistError } = await persistWorkoutPlan({
      planId: id,
      planName,
      isEditMode,
      sessions: nextSessions,
    })
    if (persistError) {
      logger.error('[WorkoutPlanEditPage] Error clearing session exercises:', persistError)
      setError(persistError)
    }
  }

  const handleSavePlan = async () => {
    if (!planName.trim()) {
      setError('Plan name is required.')
      return
    }
    // Validate that all session names are not blank
    if (planSessions.some((session) => !session.name.trim())) {
      setError('All session names must be provided.')
      return
    }
    if (planSessions.every((session) => session.planItems.length === 0)) {
      setError('Plan must contain at least one exercise across all sessions.')
      return
    }

    if (isSaving) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const persistedPlanId = await callPersistService(planSessions)

      if (!persistedPlanId) {
        setIsSaving(false)
        return
      }

      navigate('/workout-plans')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred while saving the plan.'
      logger.error('[WorkoutPlanEditPage] Error saving plan:', err)
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return

    const { error: deleteError } = await deleteWorkoutPlan(id)
    if (deleteError) {
      setError(deleteError)
      return
    }
    navigate('/workout-plans')
  }

  const handleCopy = async () => {
    if (!id) return

    const { newPlanId, error: copyError } = await copyWorkoutPlan(id, planName)
    if (copyError || !newPlanId) {
      setError(copyError ?? 'Could not copy plan.')
      return
    }
    navigate(`/workout-plans/${newPlanId}/edit`)
  }

  return (
    <PageLayout className="max-w-4xl">
      <PageCard padding="spacious">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <DecorativeIcon icon="clipboard" />
            <div>
              <Paragraph>Workout Plans</Paragraph>
              <Heading1 className="mt-2">
                {isEditMode ? 'Edit Plan' : 'Create Plan'}
              </Heading1>
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
            <h3 className="text-sm font-medium">Sessions</h3>
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
                  {sIdx === activeSessionIndex ? ( // Active session is always editable
                    <input
                      type="text"
                      value={session.name} // Directly bind to session.name
                      onChange={(e) => handleSessionNameChange(e.target.value)} // Update state directly
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1"
                      autoFocus
                    />
                  ) : (
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
                  )}
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
                Add Session
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
                    Add from Template
                  </Button>
                  <Button
                    tone="default"
                    onClick={() => {
                      void handleClearActiveSessionExercises()
                    }}
                  >
                    Clear
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
                          itemName={item.exercise_name ?? ''}
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
          <div className="flex flex-wrap items-center gap-2">
            <Button
              tone="emerald"
              className="w-fit rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={handleSavePlan}
              disabled={isSaving || isLoadingPlan}
            >
              {isSaving
                ? 'Saving...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Create Plan'}
            </Button>
            <Button tone="default" onClick={() => navigate('/workout-plans')}>
              Cancel
            </Button>
            {isEditMode ? (
              <>
                {pendingDelete ? (
                  <>
                    <Button tone="chip" onClick={() => setPendingDelete(false)}>
                      Cancel
                    </Button>
                    <Button tone="chip-destructive" onClick={handleDelete}>
                      Confirm delete
                    </Button>
                  </>
                ) : (
                  <Button
                    tone="chip-rose"
                    onClick={() => setPendingDelete(true)}
                  >
                    Delete
                  </Button>
                )}
              </>
            ) : null}
            <div className="ml-auto">
              {isEditMode ? (
                <Button tone="blue" onClick={handleCopy}>
                  Copy
                </Button>
              ) : null}
            </div>
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
