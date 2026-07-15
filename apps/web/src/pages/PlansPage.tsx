import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { getToneClass } from '../components/toneClasses'
import { usePlan } from '@gym-pilot/shared'
import { CallToAction } from '../components/CallToAction'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'

export function PlansPage() {
  const { plans, deletePlan } = usePlan()
  const basePlans = plans.filter((plan) => !plan.sourcePlanId)

  return (
    <PageLayout>
      {basePlans.length === 0 ? (
        <CallToAction
          title="No plans yet."
          description="Create a plan to track exercises and add notes for each one."
          action={
            <Link to="/plans/new" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
              Create a new plan
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-4">
            <Link to="/plans/new" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
              Create a new plan
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
        {basePlans.map((plan) => {
            return (
              <PageCard key={plan.id} padding="compact">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{plan.planName || 'Untitled plan'}</h2>
                    <p className="mt-1 text-sm text-slate-600">Base template</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/plans/${plan.planSlug ?? plan.id}`}
                      className={getToneClass('default', 'px-3 py-1.5 text-sm')}
                    >
                      View
                    </Link>
                    <Link
                      to={`/plans/${plan.planSlug ?? plan.id}/edit`}
                      className={getToneClass('default', 'px-3 py-1.5 text-sm')}
                    >
                      Update
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
        </>
      )}
    </PageLayout>
  )
}
