import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { PageCardLayout } from '../layouts/PageCardLayout'
import { PageLayout } from '../layouts/PageLayout'
import {
  formatSessionHistoryError,
  loadSessionHistoryEntries,
  saveSessionHistoryEntry,
  type SessionHistoryEntry,
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
  const [startedAt, setStartedAt] = useState('')
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
      const nextEntry = {
        ...entry,
        attendanceType,
        notes: notes.trim() ? notes.trim() : null,
        rating: normalizedRating,
        durationMinutes: durationMinutes ?? entry.durationMinutes ?? null,
        startedAt: startedAt || entry.startedAt || null,
        updatedAt: new Date().toISOString(),
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
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        {entry ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 text-sm text-slate-700">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      Session details
                    </span>
                  </div>
                  {entry.className ? (
                    <p>
                      <span className="font-medium text-slate-800">Class:</span>{' '}
                      {entry.className}
                    </p>
                  ) : null}
                  {entry.instructorName ? (
                    <p>
                      <span className="font-medium text-slate-800">
                        Instructor:
                      </span>{' '}
                      {entry.instructorName}
                    </p>
                  ) : null}
                  <p>
                    <span className="font-medium text-slate-800">Started:</span>{' '}
                    {new Date(
                      entry.startedAt ?? entry.createdAt ?? '',
                    ).toLocaleString()}
                  </p>
                  {entry.notes ? (
                    <p>
                      <span className="font-medium text-slate-800">
                        Current notes:
                      </span>{' '}
                      {entry.notes}
                    </p>
                  ) : null}
                  {typeof entry.rating === 'number' &&
                  entry.rating >= 1 &&
                  entry.rating <= 5 ? (
                    <p>
                      <span className="font-medium text-slate-800">
                        Current rating:
                      </span>{' '}
                      {entry.rating} / 5
                    </p>
                  ) : null}
                  {entry.durationMinutes != null ? (
                    <p>
                      <span className="font-medium text-slate-800">
                        Current duration:
                      </span>{' '}
                      {entry.durationMinutes} min
                    </p>
                  ) : null}
                </div>
              </div>

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
                    setDurationMinutes(nextValue === '' ? null : Number(nextValue))
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
