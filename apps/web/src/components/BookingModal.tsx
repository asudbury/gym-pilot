import { useState, useEffect } from 'react'
import { Button } from './Button'
import { ModalShell, ModalPanel } from './PageActionRow'
import { useAuth } from '../auth/AuthContext'
import { usePlan } from '@gym-pilot/shared'
import { createSession, bookSession } from '@gym-pilot/shared'

type BookingModalProps = {
  open: boolean
  onClose: () => void
  initialSessionType?: 'solo' | 'personal_training'
  initialTrainerId?: string | undefined
}

export function BookingModal({
  open,
  onClose,
  initialSessionType,
  initialTrainerId,
}: BookingModalProps) {
  const { user } = useAuth()
  const { users } = usePlan()
  const trainers = users.filter((u) => u.roles.includes('trainer'))

  const [sessionType, setSessionType] = useState<'solo' | 'personal_training'>(
    initialSessionType ?? 'personal_training',
  )
  const [trainerId, setTrainerId] = useState<string | undefined>(
    initialTrainerId ?? trainers[0]?.id,
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

  // Reset modal state when opened with initial props
  useEffect(() => {
    if (!open) return
    setSessionType(initialSessionType ?? 'personal_training')
    setTrainerId(initialTrainerId ?? trainers[0]?.id)
    // default to current local datetime for quick recording
    const now = new Date()
    const tzOffset = now.getTimezoneOffset() * 60000
    const localIso = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16)
    setStartAt(localIso)
    setDuration(30)
    setNotes('')
    setRating(null)
    setError(null)
    setDatePart(localIso.slice(0, 10))
    setTimePart(localIso.slice(11, 16))
  }, [open, initialSessionType, initialTrainerId, trainers])

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

  if (!open) return null

  const handleSubmit = async () => {
    if (!startAt || !user) {
      setError('Provide start time and be signed in.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const sessionRes = await createSession({
        sessionType: sessionType === 'solo' ? 'solo' : 'personal_training',
        trainerId:
          sessionType === 'personal_training' ? (trainerId ?? null) : null,
        trainerName:
          sessionType === 'personal_training'
            ? (trainers.find((t) => t.id === trainerId)?.name ?? null)
            : null,
        startAt: new Date(startAt).toISOString(),
        durationMinutes: duration ?? null,
        // price intentionally omitted from UI; pass null
        price: null,
      })

      if (!sessionRes.success || !sessionRes.session) {
        throw sessionRes.error || new Error('Could not create session')
      }

      const sessionId = sessionRes.session.id

      const bookingRes = await bookSession({
        sessionId,
        role: 'client',
        notes: notes ?? null,
        rating: rating ?? null,
      })

      if (!bookingRes.success) {
        throw bookingRes.error || new Error('Could not record session')
      }

      // Notify user of success
      window.dispatchEvent(
        new CustomEvent('gym-pilot-notification', {
          detail: { text: 'Session recorded', tone: 'success' },
        }),
      )

      onClose()
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setIsSaving(false)
    }
  }

  const trainerName = trainers.find((t) => t.id === trainerId)?.name ?? null
  const title =
    sessionType === 'solo'
      ? 'Record solo session'
      : trainerName
        ? `Record session with ${trainerName}`
        : 'Record personal training session'

  return (
    <ModalShell>
      <ModalPanel>
        <div className="sm:rounded-2xl rounded-t-2xl bg-white p-4">
          <h3 className="text-lg font-semibold">{title}</h3>

          <label className="mt-3 block text-sm text-slate-700">
            <span className="font-medium">Type</span>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as any)}
              className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2"
            >
              <option value="personal_training">Personal training</option>
              <option value="solo">Solo session</option>
            </select>
          </label>

          {sessionType === 'personal_training' ? (
            <label className="mt-3 block text-sm text-slate-700">
              <span className="font-medium">Trainer</span>
              <select
                value={trainerId}
                onChange={(e) => setTrainerId(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2"
              >
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.id}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="mt-3 block text-sm text-slate-700">
            <span className="font-medium">Start</span>
            {supportsDateTimeLocal === false ? (
              <div className="mt-1 flex gap-2">
                <input
                  type="date"
                  value={datePart}
                  onChange={(e) => {
                    setDatePart(e.target.value)
                    if (e.target.value && timePart) {
                      setStartAt(`${e.target.value}T${timePart}`)
                    }
                  }}
                  className="w-1/2 rounded-2xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="time"
                  value={timePart}
                  onChange={(e) => {
                    setTimePart(e.target.value)
                    if (datePart && e.target.value) {
                      setStartAt(`${datePart}T${e.target.value}`)
                    }
                  }}
                  className="w-1/2 rounded-2xl border border-slate-300 px-3 py-2"
                />
              </div>
            ) : (
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2"
              />
            )}
          </label>

          <label className="mt-3 block text-sm text-slate-700">
            <span className="font-medium">Duration (minutes)</span>
            <input
              type="number"
              value={duration ?? ''}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2"
            />
          </label>

          {/* Price is intentionally hidden from the UI */}

          <div className="mt-3 block text-sm text-slate-700">
            <span className="font-medium">Rating</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((value) => {
                const isSelected = rating === value
                return (
                  <Button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${isSelected ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    {value} / 5
                  </Button>
                )
              })}
            </div>
          </div>

          <label className="mt-3 block text-sm text-slate-700">
            <span className="font-medium">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2"
            />
          </label>

          {error ? (
            <div className="mt-2 text-sm text-rose-600">{error}</div>
          ) : null}

          <div className="mt-4 flex gap-2">
            <Button onClick={handleSubmit} tone="emerald" disabled={isSaving}>
              {isSaving ? 'Recording…' : 'Record session'}
            </Button>
            <Button onClick={onClose} tone="default">
              Cancel
            </Button>
          </div>
        </div>
      </ModalPanel>
    </ModalShell>
  )
}

export default BookingModal
