import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { getToneClass } from '../../components/toneClasses'
import { usePlan } from '@gym-pilot/shared'
import { PageCard } from '../../components/PageCard'
import { PageLayout } from '../../layouts/PageLayout'
import { Heading1, Paragraph } from '../../components/Typography'

export function AssignmentsManagerPage() {
  const { visibleUsers, visiblePlans, assignUsersToPlan } = usePlan()
  const navigate = useNavigate()
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const sourcePlans = useMemo(() => visiblePlans, [visiblePlans])

  const handleCreateAssignment = () => {
    if (!selectedPlanId || !selectedUserId) {
      return
    }

    assignUsersToPlan(selectedPlanId, [selectedUserId])
    setSelectedPlanId('')
    setSelectedUserId('')
    navigate(`/users/${selectedUserId}/assignments`)
  }

  return (
    <PageLayout className="max-w-5xl">
      <PageCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Paragraph>Assignments</Paragraph>
            <Heading1 className="mt-2">Create assignment</Heading1>
          </div>
          <Link
            to="/assignments"
            className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
          >
            Back to assignments
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="max-w-2xl space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Choose a user and a plan
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Create a single assignment copy for one person and send them
                straight to the assignments list.
              </p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">User</span>
              <select
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
              >
                <option value="">Select a user</option>
                {visibleUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Plan</span>
              <select
                value={selectedPlanId}
                onChange={(event) => setSelectedPlanId(event.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
              >
                <option value="">Select a base plan</option>
                {sourcePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.planName || 'Untitled plan'}
                  </option>
                ))}
              </select>
            </label>
            <Button
              tone="emerald"
              onClick={handleCreateAssignment}
              className="w-full justify-center px-4 py-2"
              disabled={!selectedPlanId || !selectedUserId}
            >
              Create assignment
            </Button>
          </div>
        </div>
      </PageCard>
    </PageLayout>
  )
}
