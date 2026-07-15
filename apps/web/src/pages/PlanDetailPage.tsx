import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getToneClass } from '../components/toneClasses'
import { usePlan } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'
import { ExerciseDetailsCard } from '../components/ExerciseDetailsCard'

export function PlanDetailPage() {
  const { planSlug } = useParams()
  const { plans, assignments } = usePlan()

  const plan = useMemo(() => {
    return [...plans, ...assignments].find((item) => item.planSlug === planSlug)
  }, [assignments, planSlug, plans])
  const assignment = useMemo(() => assignments.find((item) => item.planSlug === planSlug), [assignments, planSlug])
  const isAssignment = Boolean(assignment)
  const editPath = isAssignment ? `/users/${plan?.assignedUserId ?? 'user'}/assignments/${plan?.planSlug ?? planSlug}/edit` : `/plans/${plan?.planSlug ?? planSlug}/edit`
  const backPath = isAssignment ? `/users/${plan?.assignedUserId ?? 'user'}/assignments` : '/plans'
  const editLabel = isAssignment ? 'Edit assignment' : 'Edit plan'
  const backLabel = isAssignment ? 'Back to assignments' : 'Back to plans'

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
            <Heading1 className="mt-2">{plan.planName || 'Untitled plan'}</Heading1>
            {isAssignment ? (
              <p className="mt-2 text-sm text-slate-600">{assignment?.assignedUserName ? `Assignment for ${assignment.assignedUserName}` : 'Assignment for a user'}</p>
            ) : plan && 'personName' in plan && plan.personName ? (
              <p className="mt-2 text-sm text-slate-600">{`Assigned to ${plan.personName}`}</p>
            ) : null}
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
          {plan.exercises.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <ExerciseDetailsCard
                exercise={item}
                expanded={false}
              />
            </div>
          ))}
        </div>
      </PageCard>
    </PageLayout>
  )
}
