import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackLink } from '../../components/ui/BackLink'
import { getToneClass } from '../../components/toneClasses'
import { usePlan } from '@gym-pilot/shared'
import { PageCard } from '../../components/PageCard'
import { PageLayout } from '../../layouts/PageLayout'
import { Heading1, Paragraph } from '../../components/Typography'
import { ExerciseDetailsCard } from '../../components/exercises/ExerciseDetailsCard'
import {
  resolveExerciseForPlanItem,
  resolvePlanDetailViewModel,
} from '../../features/plans/domain/planDetail'
import { resolvePlanRouteSelection } from '../../features/plans/domain/planRoute'

export function PlanDetailPage() {
  const { planSlug } = useParams()
  const { visiblePlans, visibleAssignments } = usePlan()
  const [expandedExerciseIds, setExpandedExerciseIds] = useState<string[]>([])

  const { plan, assignment } = useMemo(
    () => resolvePlanRouteSelection(visiblePlans, visibleAssignments, planSlug),
    [visiblePlans, visibleAssignments, planSlug],
  )
  const viewModel = useMemo(
    () => resolvePlanDetailViewModel(plan, assignment, planSlug),
    [plan, assignment, planSlug],
  )

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
            <Heading1 className="mt-2">
              {plan?.planName ?? 'Untitled plan'}
            </Heading1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={viewModel.editPath}
              className={getToneClass('blue', 'px-4 py-2 text-sm font-medium')}
            >
              {viewModel.editLabel}
            </Link>
            <BackLink to={viewModel.backPath} label={viewModel.backLabel} />
          </div>
        </div>
        <div className="space-y-4 mt-6">
          <h3>
            <b>Exercises</b>
          </h3>

          {viewModel.sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <h4 className="font-semibold text-slate-800">{session.title}</h4>
              <div className="mt-3 space-y-3">
                {session.planItems.map((item) => {
                  const resolvedExercise = resolveExerciseForPlanItem(item)

                  return resolvedExercise ? (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-100 p-3"
                    >
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
