import { useEffect, useMemo, useState } from 'react'
import type { UserSession } from '@gym-pilot/shared'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { OptionSelector } from '../components/OptionSelector'
import { RatingSelector } from '../components/RatingSelector'
import { SessionWorkoutEditor } from '../components/SessionWorkoutEditor'
import { PageCardLayout } from '../layouts/PageCardLayout'
import { PageLayout } from '../layouts/PageLayout'
import { DesktopOnly } from '../components/visibility/DeviceVisibility'
import {
  getUserSession,
  getUserSessionWorkoutItemsForSession,
  saveWorkoutItemsForSession,
  updateUserSession,
  type UserSessionWorkoutItem,
} from '@gym-pilot/shared'
import {
  getSessionEntryRating,
  getSessionEntryTitle,
} from '../features/session-history/domain/sessionHistoryViewModel'

export function SessionEditPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { entryId } = useParams<{ entryId: string }>()
  const [entry, setEntry] = useState<UserSession | null>(null)
  const [attendanceType, setAttendanceType] = useState<'attended' | 'taught'>(
    'attended',
  )
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [sessionName, setSessionName] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const [workoutItems, setWorkoutItems] = useState<Partial<UserSessionWorkoutItem>[]>([])
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
        const { data: nextEntry } = await getUserSession(entryId, userId || '')

        if (!isActive) {
          return
        }

        setEntry(nextEntry)
        if (nextEntry) {
          setAttendanceType(
            nextEntry.attendance_type === 'taught' ? 'taught' : 'attended',
          )
          setNotes(nextEntry.notes ?? '')
          setRating(getSessionEntryRating(nextEntry))
          setDurationMinutes(nextEntry.duration_minutes ?? null)
          setStartedAt(nextEntry.start_at ?? '')
          setSessionName(nextEntry.class_name ?? '')

          if (nextEntry.session_id) {
            try {
              const { data } = await getUserSessionWorkoutItemsForSession(
                nextEntry.session_id,
              )
              if (data && data?.length > 0) {
                setWorkoutItems(data)
              } else {
                setWorkoutItems([])
              }
            } catch {
              setWorkoutItems([])
            }
          }
        }

        setErrorMessage(null)
      } catch (error) {
        if (!isActive) {
          return
        }

        setErrorMessage(String(error))
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
      } as UserSession)

      const nextEntry = {
        ...entry,
        attendance_type: attendanceType,
        notes: notes.trim() ? notes.trim() : null,
        rating: normalizedRating,
        duration_minutes: durationMinutes ?? entry.duration_minutes ?? null,
        start_at: startedAt || entry.start_at || '',
        class_name:
          entry.session_type === 'solo'
            ? sessionName.trim() || null
            : (entry.class_name ?? null),
        updatedAt: new Date().toISOString(),
      }

      if (userId && entry.session_id) {
        const workoutSaveResult = await saveWorkoutItemsForSession(
          entry.session_id,
          workoutItems,
          userId,
        )

        if (!workoutSaveResult.success) {
          throw (
            workoutSaveResult.error ?? new Error('Could not save workout items')
          )
        }
      }

      await updateUserSession(nextEntry)
      navigate('/sessions')
    } catch (error) {
      setErrorMessage(String(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageLayout className="max-w-4xl">
      <PageCardLayout
        title="Edit session"
        subtitle={pageTitle}
        description=""
        icon="edit"
      >
        {entry ? (
          <div className="space-y-2 p-0 md:space-y-4 md:rounded-2xl md:border md:border-slate-200 md:bg-slate-50 md:p-4">
            <div className="m-0 bg-white p-0 sm:m-4 sm:rounded-2xl sm:border sm:border-slate-200 sm:p-4">
              {entry.session_type !== 'solo' ? (
                <div className="mt-4 flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Role
                  </span>
                  <OptionSelector
                    options={['attended', 'taught'] as const}
                    value={attendanceType}
                    onChange={setAttendanceType}
                    getLabel={(option) =>
                      option === 'attended' ? 'Attended' : 'Taught'
                    }
                  />
                </div>
              ) : null}

              {entry.session_type === 'solo' ? (
                <label className="mt-4 flex flex-col gap-1 text-sm text-slate-700">
                  <span className="font-medium">Name</span>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(event) => setSessionName(event.target.value)}
                    className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                  />
                </label>
              ) : null}

              <label className="mt-4 flex flex-col gap-1 text-sm text-slate-700">
                <span className="font-medium">Start time</span>
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

              <DesktopOnly>
                <div className="mt-4 flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    Rating
                  </span>
                  <RatingSelector value={rating} onChange={setRating} />
                </div>

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
              </DesktopOnly>

              <div className="mt-3">
                <SessionWorkoutEditor
                  items={workoutItems}
                  onChange={setWorkoutItems}
                />
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    tone="emerald"
                    onClick={handleSave}
                    isLoading={isSaving}
                  >
                    Save changes
                  </Button>
                  <Button tone="default" onClick={() => navigate('/sessions')}>
                    Cancel
                  </Button>
                </div>
                {errorMessage ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                    {errorMessage}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </PageCardLayout>
    </PageLayout>
  )
}
