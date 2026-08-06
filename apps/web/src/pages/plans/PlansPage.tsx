import { usePlan } from '@gym-pilot/shared'
import { Link } from 'react-router-dom'
import { PageCard } from '../../components/PageCard'
import { getToneClass } from '../../components/toneClasses'
import { Button } from '../../components/ui/Button'
import { resolvePlanListViewModels } from '../../features/plans/domain/planList'
import { CallToAction } from '../../layouts/CallToAction'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { PageLayout } from '../../layouts/PageLayout'

export function PlansPage() {
  const { visiblePlans, deletePlan } = usePlan()
  const basePlans = visiblePlans
  const cards = resolvePlanListViewModels(basePlans)

  const description =
    'Create a plan to assign to clients, or view and manage existing plans.'

  return (
    <PageLayout>
      {basePlans.length === 0 ? (
        <PageCardLayout
          title="Plans"
          subtitle="Plans Dashboard"
          description={description}
        >
          <CallToAction
            title="Manage plans"
            action={
              <Link
                to="/plans/new"
                className={getToneClass(
                  'blue',
                  'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium',
                )}
              >
                Create a new plan
              </Link>
            }
          />
        </PageCardLayout>
      ) : (
        <PageCardLayout
          title="Plans"
          subtitle="Plans Dashboard"
          description={description}
        >
          <div className="flex justify-end">
            <Link
              to="/plans/new"
              className={getToneClass(
                'blue',
                'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium',
              )}
            >
              Create a new plan
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => {
              const plan = basePlans.find((item) => item.id === card.id)

              if (!plan) {
                return null
              }

              return (
                <PageCard key={card.id} padding="compact">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        {card.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {card.subtitle}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Link to={card.viewPath} className={getToneClass('chip')}>
                        View
                      </Link>
                      <Link to={card.editPath} className={getToneClass('chip')}>
                        Update
                      </Link>
                      <Button
                        tone="chip-rose"
                        onClick={() => deletePlan(plan.id)}
                      >
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
