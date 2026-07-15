import { Link } from 'react-router-dom'
import { PageLayout } from '../layouts/PageLayout'
import { getToneClass } from '../components/toneClasses'
import { CallToAction } from '../components/CallToAction'

export function AdminPage() {
  return (
    <PageLayout>
        <CallToAction
        title="Manage users"
        description="Add, edit, or remove users from the application."
            action={
              <Link to="/admin/users" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
                Manage users
              </Link>
            }
        />
        <CallToAction
          title="Database"
          description="Manage the application's database."
              action={
                <Link to="/admin/database" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
                  Database
                </Link>
              }
            />
    </PageLayout>
  )
}
