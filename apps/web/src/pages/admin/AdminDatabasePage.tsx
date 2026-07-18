import { useEffect, useMemo, useState } from 'react'
import { listJsonRecords } from '@gym-pilot/shared'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'

export function AdminDatabasePage() {
  const [databaseEntries, setDatabaseEntries] = useState<
    Array<{ key: string; value: unknown }>
  >([])

  useEffect(() => {
    void listJsonRecords().then((records) => setDatabaseEntries(records))
  }, [])

  const formattedEntries = useMemo(
    () =>
      databaseEntries.map((entry) => ({
        ...entry,
        value:
          typeof entry.value === 'string'
            ? entry.value
            : JSON.stringify(entry.value, null, 2),
      })),
    [databaseEntries],
  )

  return (
    <AdminSectionShell
      title="Database"
      subtitle="Inspect the stored JSON records"
      className="max-w-6xl"
    >
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {formattedEntries.map((entry) => (
          <div
            key={entry.key}
            className="rounded-2xl border border-slate-200 bg-white p-3"
          >
            <p className="text-sm font-semibold text-slate-800">{entry.key}</p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-600">
              {String(entry.value)}
            </pre>
          </div>
        ))}
      </div>
    </AdminSectionShell>
  )
}
