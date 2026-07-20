import { useEffect, useMemo, useState } from 'react'
import { SessionActions } from '../components/SessionActions'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import { useAuth } from '../auth/AuthContext'
import { PageCardLayout } from '../layouts/PageCardLayout'
import { PageLayout } from '../layouts/PageLayout'
import {
  deleteSessionHistoryEntry,
  formatSessionHistoryError,
  loadSessionHistoryEntries,
  saveSessionHistoryEntry,
  type SessionHistoryEntry,
} from '@gym-pilot/shared'
import { resolveAttendanceRoleLabel } from '../features/timetable/domain/timetableView'

function sortSessionEntries(entries: SessionHistoryEntry[]) {
  return [...entries].sort((left, right) =>
    (right.createdAt ?? '').localeCompare(left.createdAt ?? ''),
  )
}

function formatAttendanceDate(value?: string | null) {
  if (!value) {
    return 'Unknown date'
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString()
}

function getSessionEntryTitle(entry: SessionHistoryEntry) {
  if (entry.className?.trim()) {
    if (entry.sessionType === 'class') {
      return `Class: ${entry.className}`
    }

    return entry.className
  }

  if (entry.sessionType === 'personal_training') {
    return 'PT Session'
  }

  if (entry.sessionType === 'class') {
    return 'Class Session'
  }

  if (entry.sessionType === 'solo') {
    return 'Solo Session'
  }

  if (entry.attendanceType === 'taught') {
    return 'PT Session'
  }

  return 'Solo Session'
}

export function SessionHistoryPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<SessionHistoryEntry[]>([])
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editAttendanceType, setEditAttendanceType] = useState<
    'attended' | 'taught'
  >('attended')
  const [editNotes, setEditNotes] = useState('')
  const [editRating, setEditRating] = useState<number | null>(null)
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<
    string | null
  >(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const userId = user?.id ?? null

  useEffect(() => {
    let isActive = true

    void (async () => {
      try {
        const loadedEntries = await loadSessionHistoryEntries(
          userId ?? undefined,
        )
        if (!isActive) {
          return
        }

        const sortedLoadedEntries = sortSessionEntries(loadedEntries)
        setEntries(sortedLoadedEntries)
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
  }, [userId])

  const sortedEntries = useMemo(() => {
    return sortSessionEntries(entries)
  }, [entries])

  const startEditing = (entry: SessionHistoryEntry) => {
    setEditingEntryId(entry.id)
    setEditAttendanceType(entry.attendanceType)
    setEditNotes(entry.notes ?? '')
    setEditRating(entry.rating ?? null)
  }

  const cancelEditing = () => {
    setEditingEntryId(null)
    setEditAttendanceType('attended')
    setEditNotes('')
    setEditRating(null)
  }

  const saveEditing = async (entry: SessionHistoryEntry) => {
    const nextEntry: SessionHistoryEntry = {
      ...entry,
      attendanceType: editAttendanceType,
      notes: editNotes.trim() ? editNotes.trim() : null,
      rating: editRating ?? null,
      updatedAt: new Date().toISOString(),
    }

    try {
      await saveSessionHistoryEntry(nextEntry, userId ?? undefined)
      await refreshEntries()
      setEditingEntryId(null)
      setStatusMessage('Session updated.')
    } catch (error) {
      setErrorMessage(formatSessionHistoryError(error))
    }
  }

  const refreshEntries = async () => {
    try {
      const loadedEntries = await loadSessionHistoryEntries(userId ?? undefined)
      setEntries(sortSessionEntries(loadedEntries))
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(formatSessionHistoryError(error))
    }
  }

  const deleteEntry = async (entryId: string) => {
    if (pendingDeleteEntryId === entryId) {
      try {
        await deleteSessionHistoryEntry(entryId, userId ?? undefined)
        await refreshEntries()
        setPendingDeleteEntryId(null)
        setStatusMessage('Session deleted.')
      } catch (error) {
        setErrorMessage(formatSessionHistoryError(error))
      }
      return
    }

    setPendingDeleteEntryId(entryId)
  }

  return (
    <PageLayout className="max-w-6xl">
      <PageCardLayout
        title="Session History"
        subtitle="Session History"
        description="Review the sessions you have recorded, update any notes or rating, or remove entries that no longer apply."
        icon="tasks"
      >
        {!editingEntryId ? (
          <SessionActions includeViewSessionsButton={false} />
        ) : null}
        {errorMessage ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </p>
        ) : null}
        {statusMessage ? (
          <p className="text-sm text-emerald-700">{statusMessage}</p>
        ) : null}
        {sortedEntries.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No session entries yet.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEntries.map((entry) => {
              const isEditing = editingEntryId === entry.id

              return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          Role
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {(['attended', 'taught'] as const).map((option) => {
                            const isSelected = editAttendanceType === option
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => setEditAttendanceType(option)}
                                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${isSelected ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                              >
                                {option === 'attended' ? 'Attended' : 'Taught'}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          Rating
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((value) => {
                            const isSelected = editRating === value
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setEditRating(value)}
                                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${isSelected ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                              >
                                {value} / 5
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <label className="flex flex-col gap-1 text-sm text-slate-700">
                        <span className="font-medium">Notes</span>
                        <textarea
                          value={editNotes}
                          onChange={(event) => setEditNotes(event.target.value)}
                          rows={4}
                          placeholder="Add any notes about this session"
                          className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => saveEditing(entry)}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-slate-900">
                          {getSessionEntryTitle(entry)}
                        </p>
                        {(() => {
                          const roleLabel = resolveAttendanceRoleLabel(
                            entry.attendanceType,
                          )

                          return roleLabel ? (
                            <p className="text-sm text-slate-600">
                              {roleLabel}
                            </p>
                          ) : null
                        })()}
                        {entry.instructorName ? (
                          <p className="text-sm text-slate-600">
                            Instructor: {entry.instructorName}
                          </p>
                        ) : null}
                        <p className="text-sm text-slate-600">
                          {formatAttendanceDate(
                            entry.startedAt ?? entry.createdAt,
                          )}
                        </p>
                        {entry.notes ? (
                          <p className="text-sm text-slate-600">
                            {entry.notes}
                          </p>
                        ) : null}
                        {entry.rating ? (
                          <p className="text-sm text-slate-600">
                            Rating: {entry.rating} / 5
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(entry)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                        >
                          <DecorativeIcon icon="edit" className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        {pendingDeleteEntryId === entry.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => deleteEntry(entry.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-rose-600 bg-rose-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:border-rose-700 hover:bg-rose-700 hover:font-semibold"
                            >
                              <DecorativeIcon
                                icon="check"
                                className="h-4 w-4"
                              />
                              <span>Confirm delete</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteEntryId(null)}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:font-semibold hover:shadow-sm"
                            >
                              <DecorativeIcon
                                icon="close"
                                className="h-4 w-4"
                              />
                              <span>Cancel</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => deleteEntry(entry.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 transition-all duration-200 hover:border-rose-400 hover:bg-rose-100 hover:font-semibold hover:shadow-sm"
                          >
                            <DecorativeIcon icon="trash" className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </PageCardLayout>
    </PageLayout>
  )
}
