import { usePlan } from '@gym-pilot/shared'
import { Link } from 'react-router-dom'
import { PageCard } from '../../components/PageCard'
import { getToneClass } from '../../components/toneClasses'
import { Button } from '../../components/ui/Button'
import { resolveAssignmentListViewModels } from '../../features/plans/domain/planList'
import { CallToAction } from '../../layouts/CallToAction'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { PageLayout } from '../../layouts/PageLayout'

export function AssignmentsPage() {
  const { visibleAssignments, deleteAssignment } = usePlan()
  const cards = resolveAssignmentListViewModels(visibleAssignments)

  const description =
    'Create an assignment to track exercises and add notes for each one.'

  return (
    <PageLayout>
      {visibleAssignments.length === 0 ? (
        <PageCardLayout
          title="Assignments"
          subtitle="Assignments Dashboard"
          description={description}
        >
          <CallToAction
            title="Manage assignments"
            action={
              <Link
                to="/assignments/new"
                className={getToneClass(
                  'blue',
                  'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium',
                )}
              >
                Create a new assignment
              </Link>
            }
          />
        </PageCardLayout>
      ) : (
        <PageCardLayout
          title="Assignments"
          subtitle="Assignments Dashboard"
          description={description}
        >
          <div className="flex justify-end">
            <Link
              to="/assignments/new"
              className={getToneClass(
                'blue',
                'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium',
              )}
            >
              Create a new assignment
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((card) => {
              const assignment = visibleAssignments.find(
                (item) => item.id === card.id,
              )

              if (!assignment) {
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
                        onClick={() => deleteAssignment(assignment.id)}
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
