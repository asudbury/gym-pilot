import { useEffect, useMemo, useState } from 'react'
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

function sortSessionEntries(entries: UserSession[]) {
  return [...entries].sort((left, right) =>
    (right.created_at ?? '').localeCompare(left.created_at ?? ''),
  )
}

export function SessionHistoryPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<UserSession[]>([])
  const [pendingDeleteEntryId, setPendingDeleteEntryId] = useState<
    string | null
  >(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const userId = user?.id ?? null

  useEffect(() => {
    let isActive = true

    const loadEntries = async () => {
      try {
        if (userId == null) {
          setEntries([])
          setErrorMessage(null)
          return
        }

        const { data } = await getUserSessions(userId)

        if (!isActive) {
          return
        }

        const sortedLoadedEntries = sortSessionEntries(data ?? [])
        setEntries(sortedLoadedEntries)
        setErrorMessage(null)
      } catch (error) {
        if (!isActive) {
          return
        }

        setErrorMessage(String(error))
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
      const { data: loadedEntries } = await getUserSessions(userId || '')
      setEntries(sortSessionEntries(loadedEntries ?? []))
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(String(error))
    }
  }

  const deleteEntry = async (entryId: string) => {
    if (pendingDeleteEntryId === entryId) {
      try {
        await deleteUserSession(entryId, userId || '')
        await refreshEntries()
        setPendingDeleteEntryId(null)
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
          showClassSessionAction={Boolean(user?.gymName && user.gymName.trim())}
          showPTSessionAction={
            Boolean(user?.trainerId?.trim()) ||
            Boolean(user?.roles?.includes('trainer'))
          }
          showViewWorkoutsTemplateButton={true}
        />
        {errorMessage ? (
          <StatusMessageNotification
            message={errorMessage}
            tone="error"
            className="mb-3"
          />
        ) : null}
        {sortedEntries.length === 0 ? (
          <StatusMessageNotification
            message="No session entries yet."
            tone="info"
            className="mb-3"
          />
        ) : (
          <div className="space-y-3">
            {sortedEntries.map((entry) => (
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
