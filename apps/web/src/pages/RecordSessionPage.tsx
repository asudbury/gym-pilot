import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { PageCard } from '../components/PageCard'
import { RatingSelector } from '../components/RatingSelector'
import { SessionWorkoutEditor } from '../components/SessionWorkoutEditor'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import { Heading1, UpperCaseParagraph } from '../components/Typography'
import { PageLayout } from '../layouts/PageLayout'
import { appTokens } from '../constants/tokens'
import {
  buildSessionWorkoutMetadata,
  buildWorkoutItemsFromPlanSessions,
  createSession,
  recordSession,
  usePlan,
  type SessionWorkoutItem,
} from '@gym-pilot/shared'

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

export function RecordSessionPage() {
  const { user } = useAuth()
  const { users, visiblePlans, visibleAssignments } = usePlan()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const trainers = users.filter((candidate) =>
    candidate.roles.includes('trainer'),
  )
  const initialSessionType = resolveInitialSessionType(searchParams.get('type'))

  const [sessionType] = useState<SessionType>(initialSessionType)
  const [trainerId, setTrainerId] = useState<string | undefined>(
    trainers[0]?.id,
  )
  const [startAt, setStartAt] = useState('')
  const [datePart, setDatePart] = useState('')
  const [timePart, setTimePart] = useState('')
  const [supportsDateTimeLocal, setSupportsDateTimeLocal] = useState<
    boolean | null
  >(null)
  const [rating, setRating] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | undefined>(undefined)
  const [name, setName] = useState('')
  const [endAt] = useState<string | null>(null)
  const [activeKwh, setActiveKwh] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [workoutItems, setWorkoutItems] = useState<SessionWorkoutItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const input = document.createElement('input')
      input.setAttribute('type', 'datetime-local')
      setSupportsDateTimeLocal(input.type === 'datetime-local')
    } catch {
      setSupportsDateTimeLocal(false)
    }
  }, [])

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

      const sessionRes = await createSession({
        sessionType: normalizedSessionType,
        trainerId:
          normalizedSessionType === 'personal_training'
            ? (trainerId ?? null)
            : null,
        trainerName:
          normalizedSessionType === 'personal_training'
            ? (trainers.find((trainer) => trainer.id === trainerId)?.name ??
              null)
            : null,
        className:
          normalizedSessionType === 'solo' ? name.trim() || null : null,
        startAt: new Date(startAt).toISOString(),
        durationMinutes: duration ?? null,
        price: null,
      })

      if (!sessionRes.success || !sessionRes.session) {
        throw sessionRes.error || new Error('Could not create session')
      }

      const workoutMetadata = buildSessionWorkoutMetadata({
        workoutItems,
        endedAt: endAt || null,
        activeKwh: activeKwh || null,
        selectedPlanId: selectedPlan?.id ?? null,
        selectedPlanName: selectedPlan?.planName ?? null,
      })

      const sessionRecordingResult = await recordSession({
        sessionId: sessionRes.session.id,
        role: 'client',
        notes: notes || null,
        rating: rating ?? null,
        workoutMetadata,
        workoutItems,
      })

      if (!sessionRecordingResult.success) {
        const persistenceError = sessionRecordingResult.error
        const userMessage =
          persistenceError instanceof Error &&
          persistenceError.message.includes('workout')
            ? 'The session was recorded, but your workout details could not be saved. Please try again.'
            : 'We could not record the session right now. Please try again.'

        throw persistenceError || new Error(userMessage)
      }

      window.dispatchEvent(
        new CustomEvent('gym-pilot-notification', {
          detail: { text: 'Session recorded', tone: 'success' },
        }),
      )

      navigate('/sessions')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
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

        <div className="mt-4 space-y-2 p-0 md:mt-8 md:space-y-4 md:rounded-2xl md:border md:border-slate-200 md:bg-slate-50 md:p-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {sessionType === 'personal_training' ? (
              <label className="mt-4 block text-sm text-slate-700">
                <span className="font-medium">Trainer</span>
                <select
                  value={trainerId}
                  onChange={(event) => setTrainerId(event.target.value)}
                  className={`${appTokens.input} mt-1 w-full`}
                >
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name || trainer.id}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {sessionType === 'solo' ? (
              <label className="mt-4 block text-sm text-slate-700">
                <span className="font-medium">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={`${appTokens.input} mt-1 w-full`}
                />
              </label>
            ) : null}

            <label className="mt-4 block text-sm text-slate-700">
              <span className="font-medium">Start time</span>
              {supportsDateTimeLocal === false ? (
                <div className="mt-1 flex gap-2">
                  <input
                    type="date"
                    value={datePart}
                    onChange={(event) => {
                      setDatePart(event.target.value)
                      if (event.target.value && timePart) {
                        setStartAt(`${event.target.value}T${timePart}`)
                      }
                    }}
                    className={`${appTokens.input} w-1/2`}
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
                    className={`${appTokens.input} w-1/2`}
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
              <span className="font-medium">Duration (minutes)</span>
              <input
                type="number"
                value={duration ?? ''}
                onChange={(event) => setDuration(Number(event.target.value))}
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
              <span className="font-medium">Active kWh</span>
              <input
                type="number"
                step="0.01"
                value={activeKwh}
                onChange={(event) => setActiveKwh(event.target.value)}
                className={`${appTokens.input} mt-1 w-full`}
              />
            </label>

            <label className="mt-4 block text-sm text-slate-700">
              <span className="font-medium">Plan or assignment</span>
              <select
                value={selectedPlanId}
                onChange={(event) => setSelectedPlanId(event.target.value)}
                className={`${appTokens.input} mt-1 w-full`}
              >
                <option value="">No plan selected</option>
                {availablePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.planName}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 block text-sm text-slate-700">
              <span className="font-medium">Rating</span>
              <div className="mt-2">
                <RatingSelector value={rating} onChange={setRating} />
              </div>
            </div>

            <div className="mt-4 block text-sm text-slate-700">
              <span className="font-medium">Workout log</span>
              <div className="mt-2">
                <SessionWorkoutEditor
                  items={workoutItems}
                  onChange={setWorkoutItems}
                />
              </div>
            </div>

            <label className="mt-4 block text-sm text-slate-700">
              <span className="font-medium">Notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className={`${appTokens.input} mt-1 w-full`}
                placeholder="Add any notes for this session"
              />
            </label>

            {error ? (
              <div className="mt-3 text-sm text-rose-600">{error}</div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={handleSubmit} tone="emerald" disabled={isSaving}>
                <span className="inline-flex items-center gap-2">
                  {isSaving ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          opacity="0.25"
                        />
                        <path
                          d="M21 12a9 9 0 0 0-9-9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span>Recording…</span>
                    </>
                  ) : (
                    'Record session'
                  )}
                </span>
              </Button>
              <Button onClick={() => navigate('/')} tone="default">
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
