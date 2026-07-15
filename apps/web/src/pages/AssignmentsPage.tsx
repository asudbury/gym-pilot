import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { getToneClass } from '../components/toneClasses'
import { usePlan } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'

export function AssignmentsPage() {
  const { plans, deletePlan } = usePlan()
  const assignments = plans.filter((plan) => Boolean(plan.sourcePlanId))

  return (
    <PageLayout>
      {assignments.length === 0 ? (
        <PageCard padding="spacious">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">No assignments yet</h1>
              <p className="mt-2 text-sm text-slate-600">Create assignments from the users screen to give each person their own editable plan copy.</p>
            </div>
            <Link to="/users" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
              Create assignment
            </Link>
          </div>
        </PageCard>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Assignments</h1>
              <p className="mt-1 text-sm text-slate-600">Each assignment is its own editable copy for an individual user.</p>
            </div>
            <Link to="/users" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
              Create assignment
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {assignments.map((plan) => (
              <PageCard key={plan.id} padding="compact">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{plan.planName || 'Untitled assignment'}</h2>
                    <p className="mt-1 text-sm text-slate-600">{plan.personName ? `Assigned to ${plan.personName}` : 'No user assigned'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/users/${plan.assignedUserId ?? 'user'}/assignments/${plan.planSlug ?? plan.id}`} className={getToneClass('default', 'px-3 py-1.5 text-sm')}>
                      View
                    </Link>
                    <Link to={`/users/${plan.assignedUserId ?? 'user'}/assignments/${plan.planSlug ?? plan.id}/edit`} className={getToneClass('default', 'px-3 py-1.5 text-sm')}>
                      Update
                    </Link>
                    <Button tone="rose" onClick={() => deletePlan(plan.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </PageCard>
            ))}
          </div>
        </>
      )}
    </PageLayout>
  )
}
