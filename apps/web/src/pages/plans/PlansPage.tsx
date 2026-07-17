import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { getToneClass } from '../../components/toneClasses'
import { usePlan } from '@gym-pilot/shared'
import { CallToAction } from '../../layouts/CallToAction'
import { PageCard } from '../../components/PageCard'
import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'

export function PlansPage() {
  const { visiblePlans, deletePlan } = usePlan()
  const basePlans = visiblePlans

  return (
    <PageLayout>
      {basePlans.length === 0 ? (
        <PageCardLayout
          title="Plans"
          subtitle="Plans Dashboard"
          description="Create a plan to track exercises and add notes for each one."
        >
          <div className="flex justify-end">
            <Link to="/plans/new" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
              Create plan
            </Link>
          </div>
          <CallToAction
            title="Manage plans"
            description="Create a plan to track exercises and add notes for each one."
            action={
              <Link to="/plans/new" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
                Create a new plan
              </Link>
            }
          />
        </PageCardLayout>
      ) : (
        <PageCardLayout
          title="Plans"
          subtitle="Plans Dashboard"
          description="Create a plan to track exercises and add notes for each one."
        >
          <div className="flex justify-end">
            <Link to="/plans/new" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
              Create plan
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {basePlans.map((plan) => {
              return (
                <PageCard key={plan.id} padding="compact">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{plan.planName || 'Untitled plan'}</h2>
                      <p className="mt-1 text-sm text-slate-600">Base plan</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Link
                        to={`/plans/${plan.planSlug ?? plan.id}`}
                        className={getToneClass('default', 'px-3 py-1.5 text-sm text-center')}
                      >
                        View
                      </Link>
                      <Link
                        to={`/plans/${plan.planSlug ?? plan.id}/edit`}
                        className={getToneClass('default', 'px-3 py-1.5 text-sm text-center')}
                      >
                        Update
                      </Link>
                      <Button tone="rose" onClick={() => deletePlan(plan.id)} className="px-3 py-1.5">
                        Remove
                      </Button>
                    </div>
                  </div>
                </PageCard>
              )
            })}
          </div>
        </PageCardLayout>
      )}
    </PageLayout>
  )
}
