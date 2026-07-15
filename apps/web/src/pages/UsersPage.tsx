import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { getToneClass } from '../components/toneClasses'
import { usePlan } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'

export function UsersPage() {
  const { users, plans, createUser, assignUsersToPlan, deleteUser } = usePlan()
  const [newUserName, setNewUserName] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId), [plans, selectedPlanId])

  const handleCreateUser = () => {
    const createdUser = createUser(newUserName)

    if (createdUser) {
      setNewUserName('')
      setSelectedUserIds((current) => (current.includes(createdUser.id) ? current : [...current, createdUser.id]))
    }
  }

  const handleAssignUsers = () => {
    if (!selectedPlanId) {
      return
    }

    assignUsersToPlan(selectedPlanId, selectedUserIds)
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((current) => (current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId]))
  }

  const handleDeleteUser = (userId: string) => {
    deleteUser(userId)
    setSelectedUserIds((current) => current.filter((item) => item !== userId))
  }

  return (
    <PageLayout className="max-w-5xl">
      <PageCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Paragraph>People</Paragraph>
            <Heading1 className="mt-2">Manage users</Heading1>
          </div>
          <Link to="/plans" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
            Back to plans
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newUserName}
                onChange={(event) => setNewUserName(event.target.value)}
                placeholder="Add a new user"
                className="min-w-64 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
              />
              <Button tone="emerald" onClick={handleCreateUser} className="px-4 py-2">
                Add user
              </Button>
            </div>

            {users.length === 0 ? (
              <p className="text-sm text-slate-600">No users yet. Add someone to start assigning plans.</p>
            ) : (
              <div className="space-y-2">
                {users.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id)

                  return (
                    <div key={user.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <label className="flex flex-1 cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleUserSelection(user.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <span className="text-sm font-medium text-slate-800">{user.name}</span>
                      </label>
                      <Button tone="rose" onClick={() => handleDeleteUser(user.id)} className="px-3 py-1.5">
                        Delete
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Assign to a plan</h2>
              <p className="mt-1 text-sm text-slate-600">Pick one plan and assign the selected users in one go.</p>
            </div>

            <select
              value={selectedPlanId}
              onChange={(event) => {
                const nextPlanId = event.target.value
                setSelectedPlanId(nextPlanId)

                if (!nextPlanId) {
                  setSelectedUserIds([])
                  return
                }

                const nextPlan = plans.find((plan) => plan.id === nextPlanId)
                setSelectedUserIds(nextPlan?.assignedUserIds ?? [])
              }}
              className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
            >
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.planName || 'Untitled plan'}
                </option>
              ))}
            </select>

            {selectedPlan ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <p className="font-medium text-slate-800">Currently assigned</p>
                <p className="mt-1">{selectedPlan.assignedPeople?.join(', ') || 'No users assigned yet'}</p>
              </div>
            ) : null}

            <Button tone="emerald" onClick={handleAssignUsers} className="w-full justify-center px-4 py-2" disabled={!selectedPlanId}>
              Save assignment
            </Button>
          </div>
        </div>
      </PageCard>
    </PageLayout>
  )
}
