import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { getToneClass } from '../components/toneClasses'
import { appTokens } from '../styles/tokens'
import { usePlan } from '@gym-pilot/shared'
import type { WeeklyDay } from '@gym-pilot/types'
import { EmptyState } from '../components/EmptyState'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { ExerciseDetailsCard } from '../components/ExerciseDetailsCard'

const dayOptions: WeeklyDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function AssignmentsPage() {
  const { assignments, updateAssignmentExercise, updateAssignmentExerciseDay, deleteAssignment } = usePlan()

  return (
    <PageLayout>
      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet."
          description="Create an assignment to track exercises and add notes for each one."
          action={
            <Link to="/assignments/new" className={getToneClass('blue', 'px-4 py-2 text-sm font-medium')}>
              Create assignment
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {assignments.map((assignment) => {
            return (
              <PageCard key={assignment.id} padding="compact">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{assignment.personName}</h2>
                    <p className="mt-1 text-sm text-slate-600">{assignment.planName || 'Exercise-based assignment'}</p>
                  </div>
                  <Link
                    to={`/assignments/${assignment.assignmentSlug}`}
                    className={getToneClass('white', 'px-3 py-1.5 text-sm')}
                  >
                    Open
                  </Link>
                  <Button tone="rose" onClick={() => deleteAssignment(assignment.id)}>
                    Remove
                  </Button>
                </div>

                {assignment.exercises.length ? (
                  <div className="mt-4 space-y-3">
                    {assignment.exercises.map((item) => (
                      <div key={item.id} className={`${appTokens.surfaceSoft} rounded-2xl border border-slate-200 p-3`}>
                        <ExerciseDetailsCard
                          exercise={item}
                          expanded={false}
                          showNotesSection={false}
                          headerActions={null}
                          title={item.name}
                        />

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-sm font-medium text-slate-700" htmlFor={`assignment-${assignment.id}-${item.id}`}>
                              Notes for {item.name}
                            </label>
                            <select
                              value={item.assignedDay ?? ''}
                              onChange={(event) => updateAssignmentExerciseDay(assignment.id, item.id, event.target.value as WeeklyDay | '')}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                            >
                              <option value="">Unassigned</option>
                              {dayOptions.map((day) => (
                                <option key={day} value={day}>
                                  {day}
                                </option>
                              ))}
                            </select>
                          </div>
                          <textarea
                            id={`assignment-${assignment.id}-${item.id}`}
                            value={assignment.completedExercises[item.id] ?? ''}
                            onChange={(event) => updateAssignmentExercise(assignment.id, item.id, event.target.value)}
                            placeholder="What did they do?"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">No exercises have been added to this assignment yet.</p>
                )}
              </PageCard>
            )
          })}
        </div>
      )}
    </PageLayout>
  )
}
