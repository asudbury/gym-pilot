import { Link } from 'react-router-dom'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'
import { getToneClass } from '../components/toneClasses'

export function AdminPage() {
  return (
    <PageLayout className="max-w-5xl">
      <PageCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Paragraph>Admin</Paragraph>
            <Heading1 className="mt-2">Administration</Heading1>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link to="/admin/users" className={getToneClass('blue', 'rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5')}>
            <h2 className="text-lg font-semibold text-slate-900">Manage users</h2>
            <p className="mt-2 text-sm text-slate-600">Create, edit, and remove users from the app.</p>
          </Link>
          <Link to="/admin/database" className={getToneClass('default', 'rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5')}>
            <h2 className="text-lg font-semibold text-slate-900">Database</h2>
            <p className="mt-2 text-sm text-slate-600">Inspect the persisted records stored in the local database.</p>
          </Link>
        </div>
      </PageCard>
    </PageLayout>
  )
}
