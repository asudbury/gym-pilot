import {
  bookSession,
  createSession,
  recordSession,
  type UserSessionWorkoutItem,
} from '@gym-pilot/shared'
import React, { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification'
import {
  getSelectedSpreadsheetImportPayloads,
  type SpreadsheetWorkoutImportPreviewItem,
} from '../../features/importedWorkouts/domain/spreadsheetWorkoutImport'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { PageLayout } from '../../layouts/PageLayout'

export const SpreadsheetImportConfirmPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [previewItems, setPreviewItems] = useState<
    SpreadsheetWorkoutImportPreviewItem[]
  >([])
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [importedSessionIds, setImportedSessionIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('gym-pilot:spreadsheetImportPreview')
      const parsed = raw
        ? (JSON.parse(raw) as SpreadsheetWorkoutImportPreviewItem[])
        : []
      setPreviewItems(parsed)
    } catch {
      setPreviewItems([])
    }
  }, [location.key])

  const handleImport = async () => {
    if (!user?.id) {
      setError('You must be logged in to import spreadsheet sessions.')
      return
    }

    const payloads = getSelectedSpreadsheetImportPayloads(previewItems)
    if (payloads.length === 0) {
      setError('Select at least one session to import.')
      return
    }

    setError(null)
    setMessage(null)
    setImportedSessionIds([])
    setIsImporting(true)

    try {
      const createdIds: string[] = []
      let importedCount = 0

      for (const payload of payloads) {
        const createResult = await createSession({
          sessionType: 'solo',
          startAt: payload.session.start_at,
          durationMinutes: payload.session.duration_minutes,
          metadata: payload.session.metadata,
        })

        if (!createResult.success || !createResult.session?.id) {
          throw new Error(
            createResult.error instanceof Error
              ? createResult.error.message
              : 'Failed to create session',
          )
        }

        const workoutItems: UserSessionWorkoutItem[] =
          payload.workout_items.map((it) => ({
            ...it,
            session_id: createResult.session.id,
            user_id: user.id,
          })) as UserSessionWorkoutItem[]

        if (workoutItems.length > 0) {
          const recordResult = await recordSession({
            sessionId: createResult.session.id,
            userId: user.id,
            role: 'client',
            notes: payload.session.notes,
            workoutMetadata: payload.session.metadata,
            workoutItems,
          })

          if (!recordResult.success) {
            throw new Error(
              recordResult.error instanceof Error
                ? recordResult.error.message
                : 'Failed to record workout items',
            )
          }
        } else {
          const bookingResult = await bookSession({
            sessionId: createResult.session.id,
            userId: user.id,
            role: 'client',
            notes: payload.session.notes,
            workoutMetadata: payload.session.metadata,
          })

          if (!bookingResult.success) {
            throw new Error(
              bookingResult.error instanceof Error
                ? bookingResult.error.message
                : 'Failed to record session',
            )
          }
        }

        createdIds.push(createResult.session.id)
        importedCount += 1
      }

      setImportedSessionIds(createdIds)
      try {
        localStorage.removeItem('gym-pilot:spreadsheetImportPreview')
        localStorage.removeItem('gym-pilot:spreadsheetImportInput')
      } catch {
        // ignore
      }

      setMessage(
        `Imported ${importedCount} spreadsheet session${importedCount === 1 ? '' : 's'}.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected import error')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <PageLayout className="gap-6">
      <PageCardLayout
        title="Confirm import"
        description="Review and confirm importing the selected spreadsheet sessions."
        icon="apple"
      >
        <div className="flex flex-col gap-4">
          {error && <StatusMessageNotification tone="error" message={error} />}
          {message && (
            <div className="flex flex-col gap-3">
              <StatusMessageNotification tone="info" message={message} />
              {importedSessionIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {importedSessionIds.map((id, i) => (
                    <Button
                      key={id}
                      as={NavLink}
                      to={`/sessions/${id}/edit`}
                      tone="default"
                    >
                      {importedSessionIds.length === 1
                        ? 'Edit imported session'
                        : `Edit imported session ${i + 1}`}
                    </Button>
                  ))}
                  <Button as={NavLink} to="/sessions" tone="default">
                    View all sessions
                  </Button>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-sm font-medium">
              Selected sessions ({previewItems.filter((p) => p.selected).length}
              )
            </p>
            <ul className="mt-2 list-disc pl-5 text-xs text-slate-600 dark:text-slate-400">
              {previewItems
                .filter((p) => p.selected)
                .map((p, idx) => (
                  <li key={`${p.payload.session.session_id}-${idx}`}>
                    {new Date(p.payload.session.start_at).toLocaleDateString()}{' '}
                    — {p.payload.workout_items.length} exercises
                  </li>
                ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() =>
                navigate('/apple-fitness/import-spreadsheet/preview')
              }
              tone="default"
            >
              Back to preview
            </Button>
            <Button
              onClick={handleImport}
              tone="emerald"
              isLoading={isImporting}
              disabled={
                isImporting ||
                previewItems.filter((p) => p.selected).length === 0
              }
            >
              Import selected
            </Button>
          </div>
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}

export default SpreadsheetImportConfirmPage
