import { Link } from 'react-router-dom'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { Paragraph } from '../components/Typography'
import { getToneClass } from '../components/toneClasses'

export function SavedPlansPage() {
  return (
    <PageLayout className="max-w-3xl">
      <PageCard padding="spacious">
        <Paragraph>Templates</Paragraph>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Templates and weekly planning have been removed.</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          The app now focuses on direct exercise selection and assignment-based follow-up.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/assignments/new" className={getToneClass('blue', 'px-4 py-2 text-sm font-medium')}>
            Create assignment
          </Link>
          <Link to="/" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
            Browse exercises
          </Link>
        </div>
      </PageCard>
    </PageLayout>
  )
}
