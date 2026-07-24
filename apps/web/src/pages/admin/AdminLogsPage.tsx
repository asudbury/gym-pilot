import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { Button } from '../../components/ui/Button'
import { getSupabaseClient } from '@gym-pilot/shared'

type LogEntryRow = {
  id: string
  message: string
  details: unknown
  created_at: string | null
}

type ActivityLogEntryRow = {
  id: string
  event_type: string | null
  event_data: unknown
  created_at: string | null
}

function formatDetails(details: unknown): string {
  if (!details) {
    return '—'
  }

  if (typeof details === 'string') {
    return details
  }

  try {
    return JSON.stringify(details, null, 2)
  } catch {
    return String(details)
  }
}

function formatTimestamp(value: string | null): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

type LogViewMode = 'error' | 'audit' | 'activity' | 'combined'

type AdminLogsPageProps = {
  view?: LogViewMode
}

export function resolveLogTableName(view: LogViewMode): string | null {
  if (view === 'error') {
    return 'gym_pilot_error_log'
  }

  if (view === 'audit') {
    return 'gym_pilot_audit_log'
  }

  if (view === 'activity') {
    return 'gym_pilot_user_activity'
  }

  return null
}

function formatActivityDetails(details: unknown): string {
  if (!details) {
    return '—'
  }

  if (typeof details === 'string') {
    return details
  }

  try {
    return JSON.stringify(details, null, 2)
  } catch {
    return String(details)
  }
}

export function filterLogEntriesByText<T extends Record<string, unknown>>(
  entries: T[],
  filterText: string,
): T[] {
  const normalizedFilter = filterText.trim().toLowerCase()

  if (!normalizedFilter) {
    return entries
  }

  return entries.filter((entry) => {
    const searchableText = [
      typeof entry.message === 'string' ? entry.message : '',
      typeof entry.details === 'string'
        ? entry.details
        : JSON.stringify(entry.details ?? {}),
      typeof entry.event_type === 'string' ? entry.event_type : '',
      typeof entry.event_data === 'string'
        ? entry.event_data
        : JSON.stringify(entry.event_data ?? {}),
    ]
      .join(' ')
      .toLowerCase()

    return searchableText.includes(normalizedFilter)
  })
}

export function AdminLogsPage({ view = 'combined' }: AdminLogsPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [errorLogs, setErrorLogs] = useState<LogEntryRow[]>([])
  const [auditLogs, setAuditLogs] = useState<LogEntryRow[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState('')
  const [logFilterText, setLogFilterText] = useState('')
  const [reloadCounter, setReloadCounter] = useState(0)

  useEffect(() => {
    let isActive = true

    void (async () => {
      const client = getSupabaseClient()

      if (!client) {
        if (isActive) {
          setError('Supabase client is unavailable.')
          setLoading(false)
        }
        return
      }

      try {
        const shouldFetchErrorLogs = view === 'error' || view === 'combined'
        const shouldFetchAuditLogs = view === 'audit' || view === 'combined'
        const shouldFetchActivityLogs =
          view === 'activity' || view === 'combined'

        if (shouldFetchErrorLogs) {
          const { data: errorData, error: errorQueryError } = await client
            .from('gym_pilot_error_log')
            .select('id, message, details, created_at')
            .order('created_at', { ascending: false })

          if (!isActive) {
            return
          }

          if (errorQueryError) {
            setError('Could not load the log right now.')
            return
          }

          setErrorLogs((errorData ?? []) as LogEntryRow[])
        }

        if (shouldFetchAuditLogs) {
          const { data: auditData, error: auditQueryError } = await client
            .from('gym_pilot_audit_log')
            .select('id, message, details, created_at')
            .order('created_at', { ascending: false })

          if (!isActive) {
            return
          }

          if (auditQueryError) {
            setError('Could not load the logs right now.')
            return
          }

          setAuditLogs((auditData ?? []) as LogEntryRow[])
        }

        if (shouldFetchActivityLogs) {
          const { data: activityData, error: activityQueryError } = await client
            .from('gym_pilot_user_activity')
            .select('id, event_type, event_data, created_at')
            .order('created_at', { ascending: false })

          if (!isActive) {
            return
          }

          if (activityQueryError) {
            setError('Could not load the logs right now.')
            return
          }

          setActivityLogs((activityData ?? []) as ActivityLogEntryRow[])
        }
      } catch {
        if (isActive) {
          setError('Could not load the logs right now.')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [view, reloadCounter])

  const clearTargetTable = resolveLogTableName(view)
  const filteredErrorLogs = filterLogEntriesByText(errorLogs, logFilterText)
  const filteredAuditLogs = filterLogEntriesByText(auditLogs, logFilterText)
  const filteredActivityLogs = filterLogEntriesByText(
    activityLogs,
    logFilterText,
  )

  const title =
    view === 'audit'
      ? 'Audit log'
      : view === 'activity'
        ? 'Activity log'
        : 'Error log'
  const subtitle =
    view === 'audit'
      ? 'Inspect audit events'
      : view === 'activity'
        ? 'Inspect user activity events'
        : 'Inspect error events'
  const description =
    view === 'audit'
      ? 'Review the most recent audit entries captured.'
      : view === 'activity'
        ? 'Review the most recent user activity entries captured.'
        : 'Review the most recent error entries captured.'

  const handleClearLogs = async () => {
    const client = getSupabaseClient()

    if (!client || !clearTargetTable) {
      return
    }

    setClearing(true)
    setError('')

    try {
      const { error: deleteError } = await client
        .from(clearTargetTable)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError) {
        setError('Could not clear the logs right now.')
        return
      }

      if (view === 'audit') {
        setAuditLogs([])
      } else if (view === 'activity') {
        setActivityLogs([])
      } else {
        setErrorLogs([])
      }
    } catch {
      setError('Could not clear the logs right now.')
    } finally {
      setClearing(false)
    }
  }

  return (
    <PageLayout>
      <PageCardLayout
        title={title}
        subtitle={subtitle}
        description={description}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/logs/error')}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${view === 'error' || view === 'combined' ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                Error log
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/logs/audit')}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${view === 'audit' ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                Audit log
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/logs/activity')}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${view === 'activity' ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                Activity log
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
                <span className="font-medium">Filter</span>
                <input
                  type="text"
                  value={logFilterText}
                  onChange={(event) => setLogFilterText(event.target.value)}
                  placeholder="Search logs"
                  className="min-w-45 border-0 bg-transparent p-0 text-sm text-slate-700 outline-none"
                />
              </label>
              <Button
                type="button"
                onClick={() => {
                  navigate(location.pathname, { replace: true })
                  setReloadCounter((prev) => prev + 1)
                }}
              >
                Refresh
              </Button>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="text-sm text-slate-600">Loading logs…</div>
          ) : null}

          {view === 'audit' ? (
            <section className="m-0 bg-white p-0 sm:m-4 sm:rounded-2xl sm:border sm:border-slate-200 sm:p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Audit logs
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">
                    {filteredAuditLogs.length} / {auditLogs.length} rows
                  </span>
                  <Button
                    type="button"
                    tone="default"
                    onClick={() => void handleClearLogs()}
                    disabled={clearing}
                  >
                    {clearing ? 'Clearing…' : 'Clear log'}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {auditLogs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                    No audit log entries yet.
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                    No audit log entries match this filter.
                  </div>
                ) : (
                  filteredAuditLogs.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900">
                          {entry.message}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatTimestamp(entry.created_at)}
                        </div>
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap wrap-break-word text-xs text-slate-700">
                        {formatDetails(entry.details)}
                      </pre>
                    </article>
                  ))
                )}
              </div>
            </section>
          ) : view === 'activity' ? (
            <section className="m-0 bg-white p-0 sm:m-4 sm:rounded-2xl sm:border sm:border-slate-200 sm:p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Activity logs
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">
                    {filteredActivityLogs.length} / {activityLogs.length} rows
                  </span>
                  <Button
                    type="button"
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
          ) : (
            <section className="m-0 bg-white p-0 sm:m-4 sm:rounded-2xl sm:border sm:border-slate-200 sm:p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Error log
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">
                    {filteredErrorLogs.length} / {errorLogs.length} rows
                  </span>
                  <Button
                    type="button"
                    tone="default"
                    onClick={() => void handleClearLogs()}
                    disabled={clearing}
                  >
                    {clearing ? 'Clearing…' : 'Clear log'}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {errorLogs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                    No error log entries yet.
                  </div>
                ) : filteredErrorLogs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">
                    No error log entries match this filter.
                  </div>
                ) : (
                  filteredErrorLogs.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900">
                          {entry.message}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatTimestamp(entry.created_at)}
                        </div>
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap wrap-break-word text-xs text-slate-700">
                        {formatDetails(entry.details)}
                      </pre>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
