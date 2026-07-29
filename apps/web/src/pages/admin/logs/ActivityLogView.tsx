import { useEffect, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import {
  deleteAllActivity,
  getUserActivity,
} from '@gym-pilot/shared/src/dataServices/userActivityDataService'
import {
  filterLogEntriesByText,
  formatActivityDetails,
  formatTimestamp,
  type ActivityLogEntryRow,
} from './utils'
import type { DisplayableError } from '../../../components/ui/StatusMessageNotification'

type ActivityLogViewProps = {
  logFilterText: string
  reloadCounter: number
}

export function ActivityLogView({
  logFilterText,
  reloadCounter,
}: ActivityLogViewProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [, setError] = useState<DisplayableError>(null)

  useEffect(() => {
    let isActive = true

    void (async () => {
      setLoading(true)
      const { data, error: queryError } = await getUserActivity()

      if (!isActive) {
        return
      }

      if (queryError) {
        setError('Could not load the log right now.')
        return
      }

      setActivityLogs((data ?? []) as ActivityLogEntryRow[])
      setLoading(false)
    })()

    return () => {
      isActive = false
    }
  }, [reloadCounter])

  const handleClearLogs = async () => {
    setClearing(true)
    setError('')

    try {
      const { error: deleteError } = await deleteAllActivity()

      if (deleteError) {
        setError('Could not clear the logs right now.')
        return
      }

      setActivityLogs([])
    } catch {
      setError('Could not clear the logs right now.')
    } finally {
      setClearing(false)
    }
  }

  const filteredActivityLogs = filterLogEntriesByText(
    activityLogs,
    logFilterText,
  )

  if (loading) {
    return <div className="text-sm text-slate-600">Loading logs…</div>
  }

  return (
    <section className="m-0 bg-white p-0 sm:m-4 sm:rounded-2xl sm:border sm:border-slate-200 sm:p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Activity logs</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            {filteredActivityLogs.length} / {activityLogs.length} rows
          </span>
          <Button
            tone="default"
            onClick={() => void handleClearLogs()}
            disabled={clearing}
          >
            {clearing ? 'Clearing…' : 'Clear log'}
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        {activityLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
            No activity log entries yet.
          </div>
        ) : filteredActivityLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
            No activity log entries match this filter.
          </div>
        ) : (
          filteredActivityLogs.map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">
                  {entry.event_type ?? 'activity'}
                </div> 
                <div className="text-xs text-slate-500">
                  {formatTimestamp(entry.created_at)}
                </div>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap wrap-break-word text-xs text-slate-700">
                {formatActivityDetails(entry.event_data)}
              </pre>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
