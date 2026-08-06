import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ActivityLogView, AuditLogView, ErrorLogView } from './logs';
///import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification';
import { Button } from '../../components/ui/Button';
import { appTokens } from '../../constants/tokens';
import { PageCardLayout } from '../../layouts/PageCardLayout';
import { PageLayout } from '../../layouts/PageLayout';

type LogViewMode = 'error' | 'audit' | 'activity' | 'combined'

type AdminLogsPageProps = {
  view?: LogViewMode
}

export function AdminLogsPage({ view = 'error' }: AdminLogsPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [logFilterText, setLogFilterText] = useState('')
  const [reloadCounter, setReloadCounter] = useState(0)

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
              <Button
                type="button"
                onClick={() => navigate('/admin/logs/error')}
                tone="chip"
                className={
                  view === 'error'
                    ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                    : ''
                }
              >
                Error log
              </Button>
              <Button
                type="button"
                onClick={() => navigate('/admin/logs/audit')}
                tone="chip"
                className={
                  view === 'audit'
                    ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                    : ''
                }
              >
                Audit log
              </Button>
              <Button
                type="button"
                onClick={() => navigate('/admin/logs/activity')}
                tone="chip"
                className={
                  view === 'activity'
                    ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                    : ''
                }
              >
                Activity log
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <label className={`flex items-center gap-2 ${appTokens.pill}`}>
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
                onClick={() => {
                  navigate(location.pathname, { replace: true })
                  setReloadCounter((prev) => prev + 1)
                }}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* {error ? (
            <StatusMessageNotification message={error} tone="error" />
          ) : null} */}

          {view === 'audit' ? (
            <AuditLogView
              logFilterText={logFilterText}
              reloadCounter={reloadCounter}
            />
          ) : view === 'activity' ? (
            <ActivityLogView
              logFilterText={logFilterText}
              reloadCounter={reloadCounter}
            />
          ) : (
            <ErrorLogView
              logFilterText={logFilterText}
              reloadCounter={reloadCounter}
            />
          )}
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
