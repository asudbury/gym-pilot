import { Link } from 'react-router-dom'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'
import { getToneClass } from '../components/toneClasses'

export function PlanPage() {
  return (
    <PageLayout className="max-w-3xl">
      <PageCard padding="spacious">
        <Paragraph>Workout planning</Paragraph>
        <Heading1 className="mt-2">Planning is now focused around assignments.</Heading1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          The app now keeps things simple: browse exercises, create assignments, and add notes for each selected exercise.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/assignments/new" className={getToneClass('blue', 'px-4 py-2 text-sm font-medium')}>
            Create assignment
          </Link>
          <Link to="/assignments" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
            View assignments
          </Link>
        </div>
      </PageCard>
    </PageLayout>
  )
}
