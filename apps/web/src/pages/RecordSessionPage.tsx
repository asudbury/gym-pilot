import {
  logger,
  saveWorkoutItemsForSession,
  updateUserSession,
  usePlan,
  type UserSession,
  type UserSessionWorkoutItem,
} from '@gym-pilot/shared'
import { type PlanSession } from '@gym-pilot/types'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PageCard } from '../components/PageCard'
import { RatingSelector } from '../components/RatingSelector'
import { SessionWorkoutEditor } from '../components/SessionWorkoutEditor'
import { Heading1, UpperCaseParagraph } from '../components/Typography'
import { Button } from '../components/ui/Button'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import {
  StatusMessageNotification,
  type DisplayableError,
} from '../components/ui/StatusMessageNotification'
import { DesktopOnly } from '../components/visibility/DeviceVisibility'
import { appTokens } from '../constants/tokens'
import { PageLayout } from '../layouts/PageLayout'

function buildWorkoutItemsFromPlanSessions(
  planSessions: PlanSession[],
): Partial<UserSessionWorkoutItem>[] {
  if (!planSessions) {
    return []
  }
  const items: Partial<UserSessionWorkoutItem>[] = []
  let order = 0
  for (const session of planSessions) {
    for (const planItem of session.planItems) {
      items.push({
        id: crypto.randomUUID(),
        item_index: order,
        category: 'exercise',
        exercise_name: planItem.exercise_name,
        exercise_id: planItem.exercise_id,
        reps: planItem.reps,
        sets: planItem.workingSets,
        notes: planItem.notes,
        plan_item_id: planItem.id,
        sort_order: order,
      })
      order++
    }
  }
  return items
}

type SessionType = 'class' | 'solo' | 'personal_training'

function resolveInitialSessionType(value: string | null): SessionType {
  if (value === 'solo') {
    return 'solo'
  }

  if (value === 'class') {
    return 'class'
  }

  return 'personal_training'
}

export function resolvePersistedSessionId(
  savedSession: { id?: string | null } | null | undefined,
  fallbackId: string,
): string {
  return savedSession?.id && typeof savedSession.id === 'string'
    ? savedSession.id
    : fallbackId
}

export function detectDateTimeLocalSupport(
  windowObject: Window | null,
): boolean {
  if (!windowObject?.document) {
    return true
  }

  try {
    const input = windowObject.document.createElement('input')
    input.setAttribute('type', 'datetime-local')
    return input.type === 'datetime-local'
  } catch {
    return false
  }
}

const supportsDateTimeLocal = detectDateTimeLocalSupport(
  typeof window === 'undefined' ? null : window,
)

export function RecordSessionPage() {
  const { user } = useAuth()
  const { users, visiblePlans, visibleAssignments } = usePlan()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const trainers = users.filter((candidate) =>
    candidate.roles.includes('trainer'),
  )

  const trainer = trainers.find((trainer) => trainer.id === user?.id)

  const initialSessionType = resolveInitialSessionType(searchParams.get('type'))

  const [sessionType] = useState<SessionType>(initialSessionType)
  const [startAt, setStartAt] = useState('')
  const [datePart, setDatePart] = useState('')
  const [timePart, setTimePart] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | undefined>(undefined)
  const [name, setName] = useState('')
  // const [endAt] = useState<string | null>(null)
  const [activeKwh, setActiveKwh] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPlanId] = useState('')
  const [workoutItems, setWorkoutItems] = useState<
    Partial<UserSessionWorkoutItem>[]
  >([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<DisplayableError>(null)

  const userSessionId = useMemo(() => crypto.randomUUID(), [])

  const availablePlans = useMemo(() => {
    const candidates = [
      ...visiblePlans,
      ...visibleAssignments.map((assignment) => ({
        id: assignment.id,
        planName: assignment.assignmentName,
        planSlug: assignment.planSlug ?? assignment.id,
        planSessions: assignment.planSessions ?? [],
        createdByUserId: assignment.assignedUserId,
      })),
    ]

    return candidates.filter(
      (candidate, index, list) =>
        list.findIndex((entry) => entry.id === candidate.id) === index,
    )
  }, [visiblePlans, visibleAssignments])

  const selectedPlan = useMemo(() => {
    return availablePlans.find((plan) => plan.id === selectedPlanId)
  }, [availablePlans, selectedPlanId])

  useEffect(() => {
    const now = new Date()
    const tzOffset = now.getTimezoneOffset() * 60000
    const localIso = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16)
    setStartAt(localIso)
    setDatePart(localIso.slice(0, 10))
    setTimePart(localIso.slice(11, 16))
  }, [])

  useEffect(() => {
    if (!selectedPlan) {
      setWorkoutItems([])
      return
    }

    setWorkoutItems(
      buildWorkoutItemsFromPlanSessions(selectedPlan.planSessions),
    )
  }, [selectedPlan])

  const handleSubmit = async () => {
    if (!startAt || !user) {
      setError('Provide start time and be signed in.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const normalizedSessionType =
        sessionType === 'solo'
          ? 'solo'
          : sessionType === 'personal_training'
            ? 'personal_training'
            : 'class'

      if (normalizedSessionType === 'personal_training' && !trainer) {
        setError('Select a trainer before recording a PT session.')
        return
      }

      const userSession: UserSession = {
        id: userSessionId,
        user_id: user!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attendance_type: null,
        capacity: null,
        class_id: null,
        class_name: null,
        duration_minutes: duration ?? null,
        gym_club_id: null,
        location: null,
        metadata: null,
        notes: notes || null,
        price: null,
        rating: rating ?? null,
        role: 'client',
        session_id:
          normalizedSessionType === 'solo' ||
          normalizedSessionType === 'personal_training'
            ? userSessionId
            : null,
        session_type: normalizedSessionType,
        start_at: startAt,
        status: null,
        trainer_id:
          normalizedSessionType === 'personal_training'
            ? (trainer?.id ?? null)
            : null,
        trainer_name:
          normalizedSessionType === 'personal_training'
            ? (trainer?.name ?? null)
            : null,
      }

      const { data: savedSession, error } = await updateUserSession(userSession)
      if (error) {
        throw error
      }

      const persistedSessionId = resolvePersistedSessionId(
        savedSession,
        userSessionId,
      )

      if (persistedSessionId && workoutItems.length > 0) {
        const workoutSaveResult = await saveWorkoutItemsForSession(
          persistedSessionId,
          workoutItems,
          user!.id,
        )

        if (!workoutSaveResult.success) {
          throw (
            workoutSaveResult.error ?? new Error('Could not save workout items')
          )
        }
      }

      navigate(-1)
    } catch (err: unknown) {
      // Log the full error object for debugging purposes
      logger.error('[RecordSessionPage] Failed to record session', err)
      setError(err)
    } finally {
      setIsSaving(false)
    }
  }

  const title =
    sessionType === 'solo'
      ? 'Solo session'
      : sessionType === 'class'
        ? 'Class session'
        : 'PT session'

  return (
    <PageLayout className="max-w-4xl">
      <PageCard padding="spacious">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <DecorativeIcon icon="calendar" />
            <div>
              <UpperCaseParagraph>Record a session</UpperCaseParagraph>
              <Heading1 className="mt-2">{title}</Heading1>
            </div>
          </div>
          {/* <BackLink to="/" label="Back to dashboard" /> */}
        </div>

        <div>
          <div className="m-0 bg-white p-0 sm:m-4 sm:rounded-2xl sm:border sm:border-slate-200 sm:p-4">
            {sessionType === 'personal_training' ? (
              <label className="mt-4 block text-sm text-slate-700">
                <span className="font-medium">Trainer</span>
                <p>{trainer?.name ?? 'Select a trainer'}</p>
              </label>
            ) : null}

            {sessionType === 'solo' ? (
              <label className="mt-4 block text-sm text-slate-700">
                <span className="font-medium pl-1">
                  Name of session (optional)
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={`${appTokens.input} mt-1 w-full`}
                />
              </label>
            ) : null}

            <label className="mt-4 block text-sm text-slate-700">
              <span className="font-medium pl-1">Start time</span>
              {!supportsDateTimeLocal ? (
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="date"
                    value={datePart}
                    onChange={(event) => {
                      setDatePart(event.target.value)
                      if (event.target.value && timePart) {
                        setStartAt(`${event.target.value}T${timePart}`)
                      }
                    }}
                    className={`${appTokens.input} w-full sm:w-1/2`}
                  />
                  <input
                    type="time"
                    value={timePart}
                    onChange={(event) => {
                      setTimePart(event.target.value)
                      if (datePart && event.target.value) {
                        setStartAt(`${datePart}T${event.target.value}`)
                      }
                    }}
                    className={`${appTokens.input} w-full sm:w-1/2`}
                  />
                </div>
              ) : (
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(event) => setStartAt(event.target.value)}
                  className={`${appTokens.input} mt-1 w-full`}
                />
              )}
            </label>

            <label className="mt-4 block text-sm text-slate-700">
              <span className="font-medium pl-1">Duration (minutes)</span>
              <input
                type="number"
                value={duration ?? ''}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setDuration(nextValue === '' ? undefined : Number(nextValue))
                }}
                className={`${appTokens.input} mt-1 w-full`}
              />
            </label>

            {/* <label className="mt-4 block text-sm text-slate-700">
              <span className="font-medium">End time</span>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(event) => setEndAt(event.target.value)}
                className={`${appTokens.input} mt-1 w-full`}
              />
            </label> */}

            <label className="mt-4 block text-sm text-slate-700">
              <span className="font-medium pl-1">Active kWh</span>
              <input
                type="number"
                value={activeKwh}
                onChange={(event) => setActiveKwh(event.target.value)}
                className={`${appTokens.input} mt-1 w-full`}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </label>

            <DesktopOnly>
              <div className="mt-4 block text-sm text-slate-700">
                <span className="font-medium pl-1">Rating</span>
                <div className="mt-2">
                  <RatingSelector value={rating} onChange={setRating} />
                </div>
              </div>
            </DesktopOnly>

            <DesktopOnly>
              <label className="mt-4 block text-sm text-slate-700">
                <span className="font-medium pl-1">Notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className={`${appTokens.input} mt-1 w-full`}
                  placeholder="Add any notes for this session"
                />
              </label>
            </DesktopOnly>

            <div className="mt-4 block text-sm text-slate-700">
              <div className="text-sm font-medium text-slate-700 pl-1 mt-1">
                <Button onClick={() => navigate('/')} tone="default">
                  Pick workout template
                </Button>
              </div>

              <div className="mt-2">
                <SessionWorkoutEditor
                  items={workoutItems}
                  onChange={setWorkoutItems}
                />
              </div>
            </div>

            {error ? (
              <StatusMessageNotification
                message={error}
                tone="error"
                className="mt-2"
              />
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={handleSubmit} tone="emerald" disabled={isSaving}>
                <span className="inline-flex items-center gap-2">
                  {isSaving ? (
                    <>
                      <DecorativeIcon icon="spinner" />
                      <span>Recording…</span>
                    </>
                  ) : (
                    'Record session'
                  )}
                </span>
              </Button>
              <Button onClick={() => navigate(-1)} tone="default">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </PageCard>
    </PageLayout>
  )
}

export default RecordSessionPage
