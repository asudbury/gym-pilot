import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification';
import {
    buildSpreadsheetWorkoutImportPayloads,
    toggleSpreadsheetImportPreviewSelection,
    updateSpreadsheetImportPreviewDate,
    updateSpreadsheetImportPreviewDuration,
    updateSpreadsheetImportPreviewItem,
    type SpreadsheetWorkoutImportPreviewItem
} from '../../features/importedWorkouts/domain/spreadsheetWorkoutImport';
import { PageCardLayout } from '../../layouts/PageCardLayout';
import { PageLayout } from '../../layouts/PageLayout';

type SpreadsheetImportContent = Parameters<typeof buildSpreadsheetWorkoutImportPayloads>[0]

type SpreadsheetImportPreviewLocationState = {
  spreadsheetInput?: string
}

export const SpreadsheetImportPreviewPage: React.FC = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  
  const [spreadsheetImportError, setSpreadsheetImportError] = useState<string | null>(null)
  const [spreadsheetImportMessage, setSpreadsheetImportMessage] = useState<string | null>(null)
  
  const [previewPayloads, setPreviewPayloads] = useState<SpreadsheetWorkoutImportPreviewItem[]>([])
  const [importedSessionIds, setImportedSessionIds] = useState<string[]>([])

  // persist preview payloads so the detail page can load them
  useEffect(() => {
    try {
      localStorage.setItem('gym-pilot:spreadsheetImportPreview', JSON.stringify(previewPayloads))
    } catch {
      // ignore
    }
  }, [previewPayloads])

  const parseSpreadsheetImportContent = (rawContent: string): SpreadsheetImportContent => {
    const trimmedContent = rawContent.trim()

    if (!trimmedContent) {
      throw new Error('Please paste some spreadsheet content before importing.')
    }

    if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmedContent)
        if (parsed && typeof parsed === 'object' && 'sheets' in parsed) {
          return parsed as SpreadsheetImportContent
        }
      } catch {
        throw new Error('The pasted JSON could not be parsed.')
      }
    }

    return trimmedContent
  }

  useEffect(() => {
    const state = location.state as SpreadsheetImportPreviewLocationState | null
    const fallback = (() => {
      try {
        return localStorage.getItem('gym-pilot:spreadsheetImportInput') ?? ''
      } catch {
        return ''
      }
    })()

    const rawContent = state?.spreadsheetInput ?? fallback

    if (!user?.id) {
      setSpreadsheetImportError('You must be logged in to import spreadsheet sessions.')
      setSpreadsheetImportMessage(null)
      setPreviewPayloads([])
      return
    }

    if (!rawContent.trim()) {
      setSpreadsheetImportError('Please paste some spreadsheet content before importing.')
      setSpreadsheetImportMessage(null)
      setPreviewPayloads([])
      return
    }

    try {
      // if there's an already-persisted preview (from prior edits), prefer that
      const persisted = (() => {
        try {
          const raw = localStorage.getItem('gym-pilot:spreadsheetImportPreview')
          return raw ? (JSON.parse(raw) as SpreadsheetWorkoutImportPreviewItem[]) : null
        } catch {
          return null
        }
      })()

      if (persisted && persisted.length > 0) {
        setPreviewPayloads(persisted)
      } else {
        const parsedContent = parseSpreadsheetImportContent(rawContent)
        const payloads = buildSpreadsheetWorkoutImportPayloads(parsedContent, {
          userId: user.id,
          referenceYear: new Date().getFullYear(),
        })

        if (payloads.length === 0) {
          throw new Error('No sessions could be detected in the pasted spreadsheet content.')
        }

        setPreviewPayloads(payloads.map((payload) => ({ payload, selected: true })))
      }
      setSpreadsheetImportError(null)
      setSpreadsheetImportMessage(null)
      setImportedSessionIds([])
    } catch (error) {
      setSpreadsheetImportError(error instanceof Error ? error.message : 'An unexpected error occurred while previewing spreadsheet sessions.')
      setSpreadsheetImportMessage(null)
      setPreviewPayloads([])
    }
  }, [location.state, user?.id])

  

  return (
    <PageLayout className="gap-6">
      <PageCardLayout title="Preview spreadsheet import" description="Review each detected session before confirming the import." icon="apple">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => navigate('/apple-fitness/import-spreadsheet')} tone="default">
            Back to input
          </Button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="flex flex-col gap-3">
            {spreadsheetImportError && <StatusMessageNotification tone="error" message={spreadsheetImportError} />}

            {spreadsheetImportMessage && (
              <div className="flex flex-col gap-3">
                <StatusMessageNotification tone="info" message={spreadsheetImportMessage} />
                {importedSessionIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {importedSessionIds.map((sessionId, index) => (
                      <Button key={sessionId} as={NavLink} to={`/sessions/${sessionId}/edit`} tone="default">
                        {importedSessionIds.length === 1 ? 'Edit imported session' : `Edit imported session ${index + 1}`}
                      </Button>
                    ))}
                    <Button as={NavLink} to="/sessions" tone="default">
                      View all sessions
                    </Button>
                  </div>
                )}
              </div>
            )}

            {previewPayloads.length > 0 && (
              <div className="rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium text-slate-900 dark:text-slate-100">Preview ({previewPayloads.length} session{previewPayloads.length === 1 ? '' : 's'})</p>
                </div>

                <div className="flex flex-col gap-2">
                    {previewPayloads.map((previewItem, index) => {
                      const payload = previewItem.payload
                      return (
                        <div key={`${payload.session.session_id}-${index}`} className="rounded border border-slate-200 p-2 dark:border-slate-700">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                                    <span>Date</span>
                                    <input
                                      type="date"
                                      value={payload.session.start_at.slice(0, 10)}
                                      onChange={(event) => {
                                        const nextDate = event.target.value
                                        if (!nextDate) return
                                        const nextStartAt = new Date(`${nextDate}T00:00:00`).toISOString()
                                        setPreviewPayloads((currentItems) =>
                                          updateSpreadsheetImportPreviewItem(currentItems, index, {
                                            payload: updateSpreadsheetImportPreviewDate(currentItems[index]?.payload ?? ({} as Parameters<typeof updateSpreadsheetImportPreviewDate>[0]), nextStartAt),
                                          }),
                                        )
                                      }}
                                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                    />
                                  </label>
                               </div>
                                <div className="flex items-center gap-2">
                                  <Button onClick={() => navigate(`/apple-fitness/import-spreadsheet/preview/${index}`)} tone="default">Edit</Button>
                                  <input type="checkbox" checked={previewItem.selected} onChange={() => setPreviewPayloads((currentItems) => toggleSpreadsheetImportPreviewSelection(currentItems, index))} className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-400" />
                                </div>
                              </div>

                              <div className="mt-2 flex items-center gap-3">
                                <label className="flex items-center gap-1 pt-2 pb-2 rounded-full">
                                  <span className="text-sm">Duration</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={payload.session.duration_minutes ?? ''}
                                    onChange={(event) => {
                                      const nextValue = event.target.value
                                      const parsedValue = nextValue === '' ? null : Number(nextValue)
                                      const nextDuration = Number.isNaN(parsedValue) ? null : parsedValue
                                      setPreviewPayloads((currentItems) =>
                                        updateSpreadsheetImportPreviewItem(currentItems, index, {
                                          payload: updateSpreadsheetImportPreviewDuration(currentItems[index]?.payload ?? ({} as Parameters<typeof updateSpreadsheetImportPreviewDuration>[0]), nextDuration),
                                        }),
                                      )
                                    }}
                                    className="w-16 rounded border border-slate-300 bg-white px-1 py-0.5 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                                  />
                                  <span>min</span>
                                </label>
                              </div>

                              <div className="mt-3">
                                <p className="text-xs font-medium">Exercises ({payload.workout_items.length})</p>
                                <ul className="mt-1 list-disc pl-5 text-xs text-slate-600 dark:text-slate-400">
                                  {payload.workout_items.map((item) => (
                                    <li key={`${item.exercise_name}-${item.item_index}`}>{item.exercise_name}</li>
                                  ))}
                                </ul>
                              </div>

                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{typeof payload.session.metadata?.summary === 'string' && payload.session.metadata.summary ? payload.session.metadata.summary : 'No summary available'}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                {/* Detail view moved to a separate route: /apple-fitness/import-spreadsheet/preview/:index */}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 justify-start">
          <Button onClick={() => navigate('/apple-fitness/import-spreadsheet/confirm')} tone="emerald" disabled={previewPayloads.length === 0} className="w-full justify-start sm:w-auto">
            Continue to confirm
          </Button>
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}

export default SpreadsheetImportPreviewPage
