import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { NotificationPill } from '../components/NotificationPill'
import { SessionWorkoutEditor } from '../components/SessionWorkoutEditor'
import { PageCardLayout } from '../layouts/PageCardLayout'
import { PageLayout } from '../layouts/PageLayout'
import {
  buildSessionWorkoutMetadata,
  formatSessionHistoryError,
  loadSessionHistoryEntries,
  loadWorkoutItemsForSession,
  parseSessionWorkoutMetadata,
  saveSessionHistoryEntry,
  saveWorkoutItemsForSession,
  type SessionHistoryEntry,
  type SessionWorkoutItem,
} from '@gym-pilot/shared'
import {
  getSessionEntryRating,
  getSessionEntryTitle,
} from '../features/session-history/domain/sessionHistoryViewModel'

export function SessionEditPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { entryId } = useParams<{ entryId: string }>()
  const [entry, setEntry] = useState<SessionHistoryEntry | null>(null)
  const [attendanceType, setAttendanceType] = useState<'attended' | 'taught'>(
    'attended',
  )
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [sessionName, setSessionName] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [workoutItems, setWorkoutItems] = useState<SessionWorkoutItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const userId = user?.id ?? null

  useEffect(() => {
    if (!entryId) {
      return
    }

    let isActive = true

    void (async () => {
      try {
        const loadedEntries = await loadSessionHistoryEntries(
          userId ?? undefined,
        )
        if (!isActive) {
          return
        }

        const nextEntry =
          loadedEntries.find((candidate) => candidate.id === entryId) ?? null
        setEntry(nextEntry)
        if (nextEntry) {
          setAttendanceType(nextEntry.attendanceType)
          setNotes(nextEntry.notes ?? '')
          setRating(getSessionEntryRating(nextEntry))
          setDurationMinutes(nextEntry.durationMinutes ?? null)
          setStartedAt(nextEntry.startedAt ?? '')
          setSessionName(nextEntry.className ?? '')

          const parsedMetadata = parseSessionWorkoutMetadata(
            nextEntry.workoutMetadata,
          )
          const fallbackWorkoutItems = parsedMetadata.workoutItems

          if (nextEntry.sessionId) {
            try {
              const persistedItems = await loadWorkoutItemsForSession(
                nextEntry.sessionId,
                userId ?? undefined,
              )
              setWorkoutItems(
                persistedItems.length > 0
                  ? persistedItems
                  : fallbackWorkoutItems,
              )
            } catch {
              setWorkoutItems(fallbackWorkoutItems)
            }
          } else {
            setWorkoutItems(fallbackWorkoutItems)
          }
        } else {
          setWorkoutItems([])
        }
        setErrorMessage(null)
      } catch (error) {
        if (!isActive) {
          return
        }

        setErrorMessage(formatSessionHistoryError(error))
      }
    })()

    return () => {
      isActive = false
    }
  }, [entryId, userId])

  const pageTitle = useMemo(() => {
    if (!entry) {
      return 'Edit session'
    }

    return getSessionEntryTitle(entry)
  }, [entry])

  const handleSave = async () => {
    if (!entry) {
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const normalizedRating = getSessionEntryRating({
        ...entry,
        rating: rating ?? entry.rating,
      } as SessionHistoryEntry)
      const parsedWorkoutMetadata = parseSessionWorkoutMetadata(
        entry.workoutMetadata,
      )
      const nextEntry = {
        ...entry,
        attendanceType,
        notes: notes.trim() ? notes.trim() : null,
        rating: normalizedRating,
        durationMinutes: durationMinutes ?? entry.durationMinutes ?? null,
        startedAt: startedAt || entry.startedAt || null,
        className:
          entry.sessionType === 'solo'
            ? sessionName.trim() || null
            : (entry.className ?? null),
        workoutMetadata: buildSessionWorkoutMetadata({
          workoutItems,
          endedAt: parsedWorkoutMetadata.endedAt,
          activeKwh: parsedWorkoutMetadata.activeKwh,
          selectedPlanId: parsedWorkoutMetadata.selectedPlanId,
          selectedPlanName: parsedWorkoutMetadata.selectedPlanName,
        }),
        updatedAt: new Date().toISOString(),
      }

      if (userId && entry.sessionId) {
        const workoutSaveResult = await saveWorkoutItemsForSession(
          entry.sessionId,
          workoutItems,
          userId,
        )

        if (!workoutSaveResult.success) {
          throw (
            workoutSaveResult.error ?? new Error('Could not save workout items')
          )
        }
      }

      await saveSessionHistoryEntry(nextEntry, userId ?? undefined)
      window.dispatchEvent(
        new CustomEvent('gym-pilot-session-history-updated', {
          detail: { entry: nextEntry },
        }),
      )
      navigate('/sessions')
    } catch (error) {
      setErrorMessage(formatSessionHistoryError(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageLayout className="max-w-4xl">
      <PageCardLayout
        title="Edit session"
        subtitle={pageTitle}
        description="Update the session notes, rating, or role before saving your changes."
        icon="edit"
      >
        {errorMessage ? (
          <NotificationPill
            message={{ text: errorMessage, tone: 'error' }}
            className="mb-3"
          />
        ) : null}

        {entry ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mt-4 flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Role</span>
                <div className="flex flex-wrap gap-2">
                  {(['attended', 'taught'] as const).map((option) => {
                    const isSelected = attendanceType === option
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setAttendanceType(option)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${isSelected ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        {option === 'attended' ? 'Attended' : 'Taught'}
                      </button>
                    )
                  })}
                </div>
              </div>

              {entry.sessionType === 'solo' ? (
                <label className="mt-4 flex flex-col gap-1 text-sm text-slate-700">
                  <span className="font-medium">Name</span>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(event) => setSessionName(event.target.value)}
                    placeholder="Add a name for this session"
                    className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                  />
                </label>
              ) : null}

              <label className="mt-4 flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-medium">Date and time</span>
                <input
                  type="datetime-local"
                  value={startedAt ? startedAt.slice(0, 16) : ''}
                  onChange={(event) =>
                    setStartedAt(
                      event.target.value
                        ? new Date(event.target.value).toISOString()
                        : '',
                    )
                  }
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                />
              </label>

              <div className="mt-4 flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Rating
                </span>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const isSelected = rating === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${isSelected ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        {value} / 5
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="mt-4 flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-medium">Duration (minutes)</span>
                <input
                  type="number"
                  min="0"
                  value={durationMinutes ?? ''}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setDurationMinutes(
                      nextValue === '' ? null : Number(nextValue),
                    )
                  }}
                  placeholder="Optional"
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                />
              </label>

              <label className="mt-4 flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-medium">Notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Add any notes about this session"
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                />
              </label>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Workout log
                  </span>
                  <span className="text-xs text-slate-500">
                    Add, edit, or remove workout items here
                  </span>
                </div>
                <div className="mt-3">
                  <SessionWorkoutEditor
                    items={workoutItems}
                    onChange={setWorkoutItems}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  tone="emerald"
                  type="button"
                  onClick={handleSave}
                  isLoading={isSaving}
                >
                  Save changes
                </Button>
                <Button
                  type="button"
                  tone="default"
                  onClick={() => navigate('/sessions')}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </PageCardLayout>
    </PageLayout>
  )
}
