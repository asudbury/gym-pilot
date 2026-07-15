import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { getToneClass } from '../components/toneClasses'
import { usePlan } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { CallToAction } from '../components/CallToAction'

export function AssignmentsPage() {
  const { assignments, deleteAssignment } = usePlan()

  return (
    <PageLayout>
      {assignments.length === 0 ? (
        <CallToAction
          title="No assignments yet."
          description="Create an assignment to track exercises and add notes for each one."
          action={
            <Link to="/assignments/new" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
              Create a new assignment
            </Link>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Assignments</h1>
              <p className="mt-1 text-sm text-slate-600">Each assignment is its own editable copy for an individual user.</p>
            </div>
            <Link to="/assignments/create" className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
              Create assignment
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {assignments.map((assignment) => (
              <PageCard key={assignment.id} padding="compact">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{assignment.planName || 'Untitled assignment'}</h2>
                    <p className="mt-1 text-sm text-slate-600">{assignment.assignedUserName ? `Assigned to ${assignment.assignedUserName}` : 'No user assigned'}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Link to={`/users/${assignment.assignedUserId ?? 'user'}/assignments/${assignment.planSlug ?? assignment.id}`} className={getToneClass('default', 'px-3 py-1.5 text-sm text-center')}>
                      View
                    </Link>
                    <Link to={`/users/${assignment.assignedUserId ?? 'user'}/assignments/${assignment.planSlug ?? assignment.id}/edit`} className={getToneClass('default', 'px-3 py-1.5 text-sm text-center')}>
                      Update
                    </Link>
                    <Button tone="rose" onClick={() => deleteAssignment(assignment.id)} className="px-3 py-1.5">
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
