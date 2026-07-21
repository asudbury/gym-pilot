import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { PageCardLayout } from '../layouts/PageCardLayout'
import { PageLayout } from '../layouts/PageLayout'
import { NotificationPill } from '../components/NotificationPill'
import { SessionWorkoutEditor } from '../components/SessionWorkoutEditor'
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
import { getSessionEntryTitle } from '../features/session-history/domain/sessionHistoryViewModel'

export function SessionWorkoutPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { entryId } = useParams<{ entryId: string }>()
  const [entry, setEntry] = useState<SessionHistoryEntry | null>(null)
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

        const parsed = parseSessionWorkoutMetadata(nextEntry?.workoutMetadata)
        const fallbackWorkoutItems = parsed.workoutItems

        if (nextEntry?.sessionId) {
          try {
            const persistedItems = await loadWorkoutItemsForSession(
              nextEntry.sessionId,
              userId ?? undefined,
            )
            setWorkoutItems(
              persistedItems.length > 0 ? persistedItems : fallbackWorkoutItems,
            )
          } catch {
            setWorkoutItems(fallbackWorkoutItems)
          }
        } else {
          setWorkoutItems(fallbackWorkoutItems)
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
      return 'Edit workout'
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
      const parsedMetadata = parseSessionWorkoutMetadata(entry.workoutMetadata)
      const nextEntry = {
        ...entry,
        workoutMetadata: buildSessionWorkoutMetadata({
          workoutItems,
          endedAt: parsedMetadata.endedAt,
          activeKwh: parsedMetadata.activeKwh,
          selectedPlanId: parsedMetadata.selectedPlanId,
          selectedPlanName: parsedMetadata.selectedPlanName,
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
      navigate(`/sessions/${entry.id}/edit`)
    } catch (error) {
      setErrorMessage(formatSessionHistoryError(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageLayout className="max-w-4xl">
      <PageCardLayout
        title="Edit workout"
        subtitle={pageTitle}
        description="Add, update, or remove workout items for this session."
        icon="edit"
      >
        {errorMessage ? (
          <NotificationPill
            message={{ text: errorMessage, tone: 'error' }}
            className="mb-3"
          />
        ) : null}

        {entry ? (
          <div className="space-y-2 p-0 md:space-y-4 md:rounded-2xl md:border md:border-slate-200 md:bg-slate-50 md:p-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-700">
                Workout items
              </p>
              <div className="mt-3">
                <SessionWorkoutEditor
                  items={workoutItems}
                  onChange={setWorkoutItems}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                tone="emerald"
                type="button"
                onClick={handleSave}
                isLoading={isSaving}
              >
                Save workout
              </Button>
              <Button
                type="button"
                tone="default"
                onClick={() => navigate(`/sessions/${entry.id}/edit`)}
              >
                Back to session
              </Button>
            </div>
          </div>
        ) : null}
      </PageCardLayout>
    </PageLayout>
  )
}
