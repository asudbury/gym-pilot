import { getSupabaseClient } from '@gym-pilot/shared'
import { TableNames } from '@gym-pilot/shared/src/dataServices/tableNames'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageCard } from '../../components/PageCard'
import { Button } from '../../components/ui/Button'
import { formatDateTimeForDisplay } from '../../dateTimeFormatter'
import { mapWorkoutAssignmentRows } from '../../features/assignments/domain/assignmentView'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { PageLayout } from '../../layouts/PageLayout'

export function WorkoutAssignmentsPage() {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filterText, setFilterText] = useState('')

  const description = 'Review and manage workout assignments.'

  async function loadAssignments() {
    setLoading(true)
    const client = getSupabaseClient()
    if (!client) {
      setAssignments([])
      setLoading(false)
      return
    }

    const { data, error } = await client
      .from(TableNames.WorkoutAssignment)
      .select(
        'id, assignment_name, assigned_to_user_id, description, goal, created_at, updated_at',
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Could not load workout assignments', error)
      setAssignments([])
      setLoading(false)
      return
    }

    setAssignments(mapWorkoutAssignmentRows(Array.isArray(data) ? data : []))
    setLoading(false)
  }

  useEffect(() => {
    void loadAssignments()
  }, [])

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((assignment) =>
        assignment.assignmentName
          .toLowerCase()
          .includes(filterText.toLowerCase()),
      ),
    [assignments, filterText],
  )

  return (
    <PageLayout>
      <PageCardLayout
        title="Workout Assignments"
        subtitle="Dashboard"
        description={description}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full max-w-sm">
            <input
              type="text"
              placeholder="Search..."
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          <div>
            <Button as={Link} to="/workout-assignments/create" tone="blue">
              Create assignment
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading assignments…</p>
        ) : assignments.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No assignments yet. Create one using the button above.
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No assignments match your search.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {filteredAssignments.map((assignment) => (
              <PageCard
                key={assignment.id}
                padding="compact"
                className="cursor-pointer"
                onClick={() =>
                  navigate(`/workout-assignments/${assignment.id}/edit`)
                }
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {assignment.assignmentName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {assignment.description || 'No description provided.'}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Assigned to: {assignment.assigneeUserId || 'Unassigned'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last updated:{' '}
                      {formatDateTimeForDisplay(assignment.updatedAt, {
                        includeYear: false,
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      as={Link}
                      to={`/workout-assignments/${assignment.id}/edit`}
                      tone="chip"
                    >
                      View
                    </Button>
                  </div>
                </div>
              </PageCard>
            ))}
          </div>
        )}
      </PageCardLayout>
    </PageLayout>
  )
}
