import { Link, useParams } from 'react-router-dom'
import { getToneClass } from '../components/toneClasses'
import { usePlan } from '@gym-pilot/shared'
import type { WeeklyDay } from '@gym-pilot/types'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'
import { ExerciseDetailsCard } from '../components/ExerciseDetailsCard'

const dayOptions: WeeklyDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function AssignmentDetailPage() {
  const { assignmentSlug } = useParams()
  const { assignments, updateAssignmentExercise, updateAssignmentExerciseDay } = usePlan()

  const assignment = assignments.find((item) => item.assignmentSlug === assignmentSlug)

  if (!assignment) {
    return (
      <PageLayout className="max-w-4xl">
        <PageCard padding="spacious">
          <Paragraph>Assignment</Paragraph>
          <Heading1 className="mt-3">Assignment not found</Heading1>
        </PageCard>
      </PageLayout>
    )
  }

  return (
    <PageLayout className="max-w-5xl">
      <PageCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Paragraph>Assignment</Paragraph>
            <Heading1 className="mt-2">{assignment.personName}</Heading1>
            <p className="mt-2 text-sm text-slate-600">{assignment.planName}</p>
          </div>
          <Link to="/assignments" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
            Back to assignments
          </Link>
        </div>
      </PageCard>

      <PageCard>
        <div className="space-y-4">
          {assignment.exercises.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-700">Assigned day</p>
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
              <ExerciseDetailsCard
                exercise={item}
                expanded={true}
                title={item.name}
                noteLabel="Progress notes"
                notePlaceholder="What did they do?"
                noteRows={3}
                notesValue={assignment.completedExercises[item.id] ?? ''}
                onNoteChange={(exerciseId, value) => updateAssignmentExercise(assignment.id, exerciseId, value)}
                showNotesSection={true}
              />
            </div>
          ))}
        </div>
      </PageCard>
    </PageLayout>
  )
}
