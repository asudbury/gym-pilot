import { useState } from 'react'
import { Button } from '../../components/Button'
import { usePlan } from '@gym-pilot/shared'
import type { UserRole } from '@gym-pilot/types'
import { AdminSectionShell } from '../../components/admin/AdminSectionShell'

export function AdminUsersPage() {
  const { users, createUser, deleteUser } = usePlan()
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('client')

  const handleCreateUser = () => {
    const createdUser = createUser(newUserName, newUserRole)

    if (createdUser) {
      setNewUserName('')
      setNewUserRole('client')
    }
  }

  return (
    <AdminSectionShell title="Manage users" subtitle="Create and remove users" className="max-w-5xl">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
            <option value="client">Client</option>
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
    </AdminSectionShell>
  )
}
