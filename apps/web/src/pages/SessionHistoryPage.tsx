import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { PageCardLayout } from '../layouts/PageCardLayout'
import { PageLayout } from '../layouts/PageLayout'
import { StatusMessageNotification } from '../components/ui/StatusMessageNotification'
import {
  getUserSessions,
  type UserSession,
  deleteUserSession,
} from '@gym-pilot/shared'
import SessionActions from '../components/SessionActions'
import { SessionEntryCard } from '../components/session-history/SessionEntryCard'
import {
  isReadyToDelete,
  resetDeletionState,
} from '../features/session-history/domain/sessionDeletion'
import {
  sortSessionEntries,
} from '../features/session-history/domain/sessionHistoryViewModel'
import { canAccessTimetable, canAccessPTSessions } from '../features/dashboard/domain/capabilityResolution'

export function SessionHistoryPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<UserSession[]>([])
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<
    string | null
  >(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const userId = user?.id ?? null

  const loadEntries = useCallback(async () => {
    try {
      if (userId == null) {
        setEntries([])
        setErrorMessage(null)
        return
      }

      const { data } = await getUserSessions(userId)
      setEntries(sortSessionEntries(data ?? []))
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(String(error))
    }
  }, [userId])

  useEffect(() => {
    let isActive = true

    void loadEntries().then(() => {
      if (!isActive) {
        setEntries([])
      }
    })

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
  }, [loadEntries])

  const deleteEntry = async (entryId: string) => {
    if (isReadyToDelete(pendingDeleteEntryId, entryId)) {
      try {
        await deleteUserSession(entryId, userId || '')
        await loadEntries()
        setPendingDeleteEntryId(resetDeletionState())
      } catch (error) {
        setErrorMessage(String(error))
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
          showViewSessionsButton={false}
          showClassSessionAction={canAccessTimetable(user)}
          showPTSessionAction={canAccessPTSessions(user)}
          showViewWorkoutsTemplateButton={true}
        />
        {errorMessage ? (
          <StatusMessageNotification
            message={errorMessage}
            tone="error"
            className="mb-3"
          />
        ) : null}
        {entries.length === 0 ? (
          <StatusMessageNotification
            message="No session entries yet."
            tone="info"
            className="mb-3"
          />
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <SessionEntryCard
                key={entry.id}
                entry={entry}
                pendingDeleteEntryId={pendingDeleteEntryId}
                setPendingDeleteEntryId={setPendingDeleteEntryId}
                deleteEntry={deleteEntry}
              />
            ))}
          </div>
        )}
      </PageCardLayout>
    </PageLayout>
  )
}
