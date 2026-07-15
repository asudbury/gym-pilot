import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { getToneClass } from '../components/toneClasses'
import { usePlan } from '@gym-pilot/shared'
import { CallToAction } from '../components/CallToAction'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'

export function PlansPage() {
  const { plans, deletePlan } = usePlan()

  return (
    <PageLayout>
      {plans.length === 0 ? (
        <CallToAction
          title="No plans yet."
          description="Create a plan to track exercises and add notes for each one."
          action={
            <Link to="/plans/new" className={getToneClass('blue', 'px-4 py-2 text-sm font-medium')}>
              Create plan
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            return (
              <PageCard key={plan.id} padding="compact">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{plan.planName || 'Untitled plan'}</h2>
                    <p className="mt-1 text-sm text-slate-600">{plan.personName ? `Assigned to ${plan.personName}` : 'No user assigned'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to="/users"
                      className={getToneClass('default', 'px-3 py-1.5 text-sm')}
                    >
                      Manage users
                    </Link>
                    <Link
                      to={`/plans/${plan.planSlug ?? plan.id}`}
                      className={getToneClass('white', 'px-3 py-1.5 text-sm')}
                    >
                      Open
                    </Link>
                    <Button tone="rose" onClick={() => deletePlan(plan.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              </PageCard>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}
