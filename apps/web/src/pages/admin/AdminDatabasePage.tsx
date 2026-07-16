import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getToneClass } from '../../components/toneClasses'
import { PageCard } from '../../components/PageCard'
import { PageLayout } from '../../layouts/PageLayout'
import { Heading1, Paragraph } from '../../components/Typography'
import { listJsonRecords } from '@gym-pilot/shared'

export function AdminDatabasePage() {
  const [databaseEntries, setDatabaseEntries] = useState<Array<{ key: string; value: unknown }>>([])

  useEffect(() => {
    void listJsonRecords().then((records) => setDatabaseEntries(records))
  }, [])

  const formattedEntries = useMemo(() => databaseEntries.map((entry) => ({
    ...entry,
    value: typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value, null, 2),
  })), [databaseEntries])

  return (
    <PageLayout className="max-w-6xl">
      <PageCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Paragraph>Admin</Paragraph>
            <Heading1 className="mt-2">Database</Heading1>
          </div>
          <Link to="/admin" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
            Back to admin
          </Link>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {formattedEntries.map((entry) => (
            <div key={entry.key} className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-800">{entry.key}</p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-600">{String(entry.value)}</pre>
            </div>
          ))}
        </div>
      </PageCard>
    </PageLayout>
  )
}
