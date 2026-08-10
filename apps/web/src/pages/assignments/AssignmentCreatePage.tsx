import { getSupabaseClient } from '@gym-pilot/shared'
import { TableNames } from '@gym-pilot/shared/src/dataServices/tableNames'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { PageCard } from '../../components/PageCard'
import { Heading1, Paragraph } from '../../components/Typography'
import { BackLink } from '../../components/ui/BackLink'
import { PageLayout } from '../../layouts/PageLayout'
import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification'
import { createAssignmentFromPlan } from '../../features/assignments/domain/assignmentCreation'
import type { Plan } from '@gym-pilot/types'

export function AssignmentCreatePage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [assignmentName, setAssignmentName] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void loadPlans()
  }, [])

  async function loadPlans() {
    const client = getSupabaseClient()
    if (!client) {
      setError('Supabase client is not available.')
      return
    }

    setLoading(true)
    setError(null)

    const { data: planRows, error: planError } = await client
      .from(TableNames.WorkoutPlan)
      .select('id, plan_name, created_at, updated_at, user_id')
      .order('created_at', { ascending: false })

    if (planError) {
      setError(planError.message || 'Could not load plans.')
      setLoading(false)
      return
    }

    const planList = Array.isArray(planRows)
      ? planRows.map((plan) => ({
          id: plan.id,
          planName: plan.plan_name,
          planSessions: [],
          createdByUserId: plan.user_id,
        }))
      : []

    setPlans(planList)
    if (planList.length > 0 && !selectedPlanId) {
      setSelectedPlanId(planList[0].id)
    }
    setLoading(false)
  }

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId),
    [plans, selectedPlanId],
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!selectedPlan) {
      setError('Please select a plan first.')
      return
    }

    if (!selectedUserId) {
      setError('Please select the user to assign to.')
      return
    }

    const client = getSupabaseClient()
    if (!client) {
      setError('Supabase client is not available.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { data: authData, error: authError } = await client.auth.getUser()
      if (authError || !authData?.user) {
        throw new Error('Unable to determine the current user.')
      }

      const createdAssignment = await createAssignmentFromPlan(
        {
          plan: selectedPlan,
          assignmentName:
            assignmentName.trim() ||
            `${selectedPlan.planName} - ${selectedUserId}`,
          creatorUserId: authData.user.id,
          assigneeUserId: selectedUserId,
          allocatedByUserId: authData.user.id,
          description: description.trim() || null,
          goal: goal.trim() || null,
          notes: notes.trim() || null,
        },
        client,
      )

      if (createdAssignment.id) {
        navigate('/workout-plans')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageLayout className="max-w-3xl">
      <PageCard padding="spacious">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Paragraph>Assignments</Paragraph>
            <Heading1 className="mt-2">Create assignment</Heading1>
          </div>
          <BackLink />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Plan
            </label>
            <select
              value={selectedPlanId}
              onChange={(event) => setSelectedPlanId(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.planName}
                </option>
              ))}
            </select>
            {loading ? (
              <p className="mt-2 text-sm text-slate-500">Loading plans…</p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              User
            </label>
            <input
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="User ID"
            />
            <p className="mt-2 text-xs text-slate-500">
              Enter the target user id for this assignment.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Assignment name
            </label>
            <input
              value={assignmentName}
              onChange={(event) => setAssignmentName(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Optional custom title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="What this assignment is for"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Goal
            </label>
            <input
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Assignment goal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              rows={4}
              placeholder="Additional notes"
            />
          </div>

          {error ? (
            <StatusMessageNotification message={error} tone="error" />
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button tone="emerald" type="submit" isLoading={submitting}>
              Create assignment
            </Button>
            <Button tone="default" onClick={() => navigate('/workout-plans')}>
              Cancel
            </Button>
          </div>
        </form>
      </PageCard>
    </PageLayout>
  )
}
