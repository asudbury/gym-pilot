import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotificationPill } from '../components/NotificationPill'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import { useAuth } from '../auth/AuthContext'
import { PageCardLayout } from '../layouts/PageCardLayout'
import { PageLayout } from '../layouts/PageLayout'
import {
  deleteSessionHistoryEntry,
  formatSessionHistoryError,
  loadSessionHistoryEntries,
  type SessionHistoryEntry,
} from '@gym-pilot/shared'
import { resolveAttendanceRoleLabel } from '../features/timetable/domain/timetableView'
import {
  getSessionEntryRating,
  getSessionEntryTitle,
} from '../features/session-history/domain/sessionHistoryViewModel'
import SessionActions from '../components/SessionActions'

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

export function SessionHistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [entries, setEntries] = useState<SessionHistoryEntry[]>([])
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<
    string | null
  >(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const userId = user?.id ?? null

  useEffect(() => {
    let isActive = true

    const loadEntries = async () => {
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
    }

    void loadEntries()

    const handleHistoryUpdated = () => {
      void loadEntries()
    }

    window.addEventListener(
      'gym-pilot-session-history-updated',
      handleHistoryUpdated,
    )

    return () => {
      isActive = false
      window.removeEventListener(
        'gym-pilot-session-history-updated',
        handleHistoryUpdated,
      )
    }
  }, [userId])

  const sortedEntries = useMemo(() => {
    return sortSessionEntries(entries)
  }, [entries])

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
        description=""
        icon="calendar"
      >
        <SessionActions
          includeViewSessionsButton={false}
          showClassSessionAction={Boolean(user?.gymName && user.gymName.trim())}
          showPTSessionAction={Boolean(user?.trainerId?.trim()) || Boolean(user?.roles?.includes('trainer'))}
        />
        {errorMessage ? (
          <NotificationPill
            message={{ text: errorMessage, tone: 'error' }}
            className="mb-3"
          />
        ) : null}
        {sortedEntries.length === 0 ? (
          <div className="rounded-none border-0 bg-transparent p-0 text-sm text-slate-600 md:rounded-2xl md:border md:border-slate-200 md:bg-slate-50 md:p-4">
            No session entries yet.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEntries.map((entry) => {
              return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
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
                          <p className="text-sm text-slate-600">{roleLabel}</p>
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
                        <p className="text-sm text-slate-600">{entry.notes}</p>
                      ) : null}
                      {entry.durationMinutes != null ? (
                        <p className="text-sm text-slate-600">
                          Duration: {entry.durationMinutes} min
                        </p>
                      ) : null}
                      {(() => {
                        const rating = getSessionEntryRating(entry)
                        return rating != null ? (
                          <p className="text-sm text-slate-600">
                            Rating: {rating} / 5
                          </p>
                        ) : null
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pendingDeleteEntryId !== entry.id ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/sessions/${entry.id}/edit`)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:font-semibold hover:shadow-sm"
                        >
                          <DecorativeIcon icon="edit" className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      ) : null}
                      {pendingDeleteEntryId === entry.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => deleteEntry(entry.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-rose-600 bg-rose-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:border-rose-700 hover:bg-rose-700 hover:font-semibold"
                          >
                            <DecorativeIcon icon="check" className="h-4 w-4" />
                            <span>Confirm delete</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteEntryId(null)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:font-semibold hover:shadow-sm"
                          >
                            <DecorativeIcon icon="close" className="h-4 w-4" />
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
                </div>
              )
            })}
          </div>
        )}
      </PageCardLayout>
    </PageLayout>
  )
}
