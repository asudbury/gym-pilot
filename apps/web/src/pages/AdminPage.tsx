import { Link } from 'react-router-dom'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'
import { getToneClass } from '../components/toneClasses'
import { CallToAction } from '../components/CallToAction'

export function AdminPage() {
  return (
    <PageLayout className="max-w-5xl">
      <PageCard>
        <div>
          <div>
            <Paragraph>Admin</Paragraph>
            <Heading1 className="mt-2">Administration</Heading1>
          </div>
          <br />
          <div>
               <CallToAction
                title="Manage users"
                description="Add, edit, or remove users from the application."
                    action={
                      <Link to="/admin/users" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
                        Manage users
                      </Link>
                    }
                />
                <br />
                <CallToAction
                  title="Database"
                  description="Manage the application's database."
                      action={
                        <Link to="/admin/database" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
                          Database
                        </Link>
                      }
                    />
          </div>
        </div>
      </PageCard>
    </PageLayout>
  )
}
