import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { getToneClass } from '../components/toneClasses'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'
import { usePlan } from '@gym-pilot/shared'
import type { UserRole } from '@gym-pilot/types'

export function AdminUsersPage() {
  const { users, createUser, deleteUser } = usePlan()
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('user')

  const handleCreateUser = () => {
    const createdUser = createUser(newUserName, newUserRole)

    if (createdUser) {
      setNewUserName('')
      setNewUserRole('user')
    }
  }

  return (
    <PageLayout className="max-w-5xl">
      <PageCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Paragraph>Admin</Paragraph>
            <Heading1 className="mt-2">Manage users</Heading1>
          </div>
          <Link to="/admin" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
            Back to admin
          </Link>
        </div>

        <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              type="text"
              value={newUserName}
              onChange={(event) => setNewUserName(event.target.value)}
              placeholder="Add a new user"
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 sm:min-w-64 sm:w-auto"
            />
            <select
              value={newUserRole}
              onChange={(event) => setNewUserRole(event.target.value as UserRole)}
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 sm:w-auto"
            >
              <option value="admin">Admin</option>
              <option value="trainer">Trainer</option>
              <option value="user">User</option>
            </select>
            <Button tone="emerald" onClick={handleCreateUser} className="px-4 py-2">
              Add user
            </Button>
          </div>

          {users.length === 0 ? (
            <p className="text-sm text-slate-600">No users yet. Add someone to get started.</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-800">{user.name}</span>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{user.role}</p>
                  </div>
                  <Button tone="rose" onClick={() => deleteUser(user.id)} className="px-3 py-1.5">
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageCard>
    </PageLayout>
  )
}
