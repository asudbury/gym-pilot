import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { PageCard } from '../components/PageCard'
import { BackLink } from '../components/ui/BackLink'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import { Heading1, Paragraph } from '../components/Typography'
import { PageLayout } from '../layouts/PageLayout'
import { appTokens } from '../constants/tokens'
import { createSession, recordSession, usePlan } from '@gym-pilot/shared'

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
  const { users } = usePlan()
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
  const [duration, setDuration] = useState<number | undefined>(30)
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        startAt: new Date(startAt).toISOString(),
        durationMinutes: duration ?? null,
        price: null,
      })

      if (!sessionRes.success || !sessionRes.session) {
        throw sessionRes.error || new Error('Could not create session')
      }

      const sessionRecordingResult = await recordSession({
        sessionId: sessionRes.session.id,
        role: 'client',
        notes: notes || null,
        rating: rating ?? null,
      })

      if (!sessionRecordingResult.success) {
        throw (
          sessionRecordingResult.error || new Error('Could not record session')
        )
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
      ? 'Record solo session'
      : sessionType === 'class'
        ? 'Book class session'
        : 'Record personal training session'

  return (
    <PageLayout className="max-w-4xl">
      <PageCard padding="spacious">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <DecorativeIcon icon="calendar" />
            <div>
              <Paragraph>Record session</Paragraph>
              <Heading1 className="mt-2">{title}</Heading1>
            </div>
          </div>
          <BackLink to="/" label="Back to dashboard" />
        </div>

        <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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

            <label className="mt-4 block text-sm text-slate-700">
              <span className="font-medium">Start</span>
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

            <div className="mt-4 block text-sm text-slate-700">
              <span className="font-medium">Rating</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((value) => {
                  const isSelected = rating === value
                  return (
                    <Button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      tone={isSelected ? 'blue' : 'default'}
                      className={isSelected ? 'shadow-sm' : ''}
                    >
                      {value} / 5
                    </Button>
                  )
                })}
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
                {isSaving ? 'Recording…' : 'Record session'}
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
