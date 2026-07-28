import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ActivityLogView, AuditLogView, ErrorLogView } from './logs';
///import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification';
import { Button } from '../../components/ui/Button';
import { PageCardLayout } from '../../layouts/PageCardLayout';
import { PageLayout } from '../../layouts/PageLayout';

type LogViewMode = 'error' | 'audit' | 'activity' | 'combined';

type AdminLogsPageProps = {
  view?: LogViewMode;
};

export function AdminLogsPage({ view = 'error' }: AdminLogsPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [logFilterText, setLogFilterText] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const title =
    view === 'audit'
      ? 'Audit log'
      : view === 'activity'
      ? 'Activity log'
      : 'Error log';
  const subtitle =
    view === 'audit'
      ? 'Inspect audit events'
      : view === 'activity'
      ? 'Inspect user activity events'
      : 'Inspect error events';
  const description =
    view === 'audit'
      ? 'Review the most recent audit entries captured.'
      : view === 'activity'
      ? 'Review the most recent user activity entries captured.'
      : 'Review the most recent error entries captured.';

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
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  view === 'error'
                    ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Error log
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/logs/audit')}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  view === 'audit'
                    ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Audit log
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/logs/activity')}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  view === 'activity'
                    ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
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
                onClick={() => {
                  navigate(location.pathname, { replace: true });
                  setReloadCounter((prev) => prev + 1);
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
  );
}
