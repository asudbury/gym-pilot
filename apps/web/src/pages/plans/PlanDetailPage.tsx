import { useMemo, useState, type JSXElementConstructor, type Key, type ReactElement, type ReactNode, type ReactPortal } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getToneClass } from '../../components/toneClasses'
import { exercises, usePlan } from '@gym-pilot/shared'
import type { Assignment  } from '@gym-pilot/types'
import { PageCard } from '../../components/PageCard'
import { PageLayout } from '../../layouts/PageLayout'
import { Heading1, Paragraph } from '../../components/Typography'
import { ExerciseDetailsCard } from '../../components/ExerciseDetailsCard'

export function PlanDetailPage() {
  const { planSlug } = useParams()
  const { plans, assignments } = usePlan()
  const [expandedExerciseIds, setExpandedExerciseIds] = useState<string[]>([])

  const plan = useMemo(() => plans.find((item) => item.planSlug === planSlug), [plans, planSlug])

  const assignment = useMemo<Assignment | undefined>(() => assignments.find((item) => item.id === planSlug), [assignments, planSlug])
  const isAssignment = Boolean(assignment)
  const editPath = isAssignment ? `/users/${assignment?.assignedUserId ?? 'user'}/assignments/${assignment?.id ?? planSlug}/edit` : `/plans/${plan?.id ?? planSlug}/edit`
  const backPath = isAssignment ? `/users/${assignment?.assignedUserId ?? 'user'}/assignments` : '/plans'
  const editLabel = 'Edit plan'
  const backLabel = 'Back to plans'

  const toggleExerciseExpanded = (exerciseId: string) => {
    setExpandedExerciseIds((current) => {
      if (current.includes(exerciseId)) {
        return current.filter((item) => item !== exerciseId)
      }

      return [...current, exerciseId]
    })
  }

  if (!plan) {
    return (
      <PageLayout className="max-w-4xl">
        <PageCard padding="spacious">
          <Paragraph>Plan</Paragraph>
          <Heading1 className="mt-3">Plan not found</Heading1>
        </PageCard>
      </PageLayout>
    )
  }

  return (
    <PageLayout className="max-w-5xl">
      <PageCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Paragraph>Plan</Paragraph>
            <Heading1 className="mt-2">{plan?.planName ?? 'Untitled plan'}</Heading1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={editPath} className={getToneClass('blue', 'px-4 py-2 text-sm font-medium')}>
              {editLabel}
            </Link>
            <Link to={backPath} className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
              {backLabel}
            </Link>
          </div>
        </div>
        <div className="space-y-4 mt-6">
          <h3><b>Exercises</b></h3>

          {(plan.planSessions ?? []).map((session: { id: Key | null | undefined; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; planItems: any }) => (
            <div key={session.id} className="rounded-2xl border border-slate-200 p-4">
              <h4 className="font-semibold text-slate-800">{session.title}</h4>
              <div className="mt-3 space-y-3">
                {(session.planItems ?? []).map((item: { exercise_id: string; id: string; exercise_name: string }) => {
                  const resolvedExercise = exercises.find((
                    exercise) => exercise.id === item.exercise_id || exercise.id === item.id || exercise.name === item.exercise_name)

                  return resolvedExercise ? (
                    <div key={item.id} className="rounded-xl border border-slate-100 p-3">
                      <ExerciseDetailsCard
                        exercise={resolvedExercise}
                        expanded={expandedExerciseIds.includes(item.id)}
                        onToggle={() => toggleExerciseExpanded(item.id)}
                      />
                    </div>
                  ) : null
                })}
              </div>
            </div>
          ))}
        </div>
      </PageCard>
    </PageLayout>
  )
}
