import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { Button } from '../../components/Button'
import { getSupabaseClient } from '@gym-pilot/shared'

type LogEntryRow = {
  id: string
  message: string
  details: unknown
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

type LogViewMode = 'error' | 'audit' | 'combined'

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

  return null
}

export function AdminLogsPage({ view = 'combined' }: AdminLogsPageProps) {
  const navigate = useNavigate()
  const [errorLogs, setErrorLogs] = useState<LogEntryRow[]>([])
  const [auditLogs, setAuditLogs] = useState<LogEntryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState('')

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

        if (shouldFetchErrorLogs) {
          const { data: errorData, error: errorQueryError } = await client
            .from('gym_pilot_error_log')
            .select('id, message, details, created_at')
            .order('created_at', { ascending: false })

          if (!isActive) {
            return
          }

          if (errorQueryError) {
            setError('Could not load the logs right now.')
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
  }, [view])

  const clearTargetTable = resolveLogTableName(view)

  const title = view === 'audit' ? 'Audit log' : 'Error log'
  const subtitle =
    view === 'audit'
      ? 'Inspect audit events'
      : 'Inspect error events'
  const description =
    view === 'audit'
      ? 'Review the most recent audit entries captured.'
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
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => window.location.reload()}>
              Refresh
            </Button>
            <button
              type="button"
              onClick={() => navigate('/admin/logs/error')}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${view === 'error' || view === 'combined' ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              Error logs
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/logs/audit')}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${view === 'audit' ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              Audit logs
            </button>
          </div>

          {error ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</div> : null}

          {loading ? <div className="text-sm text-slate-600">Loading logs…</div> : null}

          {view === 'audit' ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Audit logs</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{auditLogs.length} rows</span>
                  <Button
                    type="button"
                    tone="default"
                    onClick={() => void handleClearLogs()}
                    disabled={clearing}
                  >
                    {clearing ? 'Clearing…' : 'Clear logs'}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {auditLogs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">No audit log entries yet.</div>
                ) : (
                  auditLogs.map((entry) => (
                    <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900">{entry.message}</div>
                        <div className="text-xs text-slate-500">{formatTimestamp(entry.created_at)}</div>
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap wrap-break-word text-xs text-slate-700">
                        {formatDetails(entry.details)}
                      </pre>
                    </article>
                  ))
                )}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Error logs</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{errorLogs.length} rows</span>
                  <Button
                    type="button"
                    tone="default"
                    onClick={() => void handleClearLogs()}
                    disabled={clearing}
                  >
                    {clearing ? 'Clearing…' : 'Clear logs'}
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {errorLogs.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-600">No error log entries yet.</div>
                ) : (
                  errorLogs.map((entry) => (
                    <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900">{entry.message}</div>
                        <div className="text-xs text-slate-500">{formatTimestamp(entry.created_at)}</div>
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
