import type { User, UserRole } from '@gym-pilot/types'
import {
  availableAdminRoles,
  type AdminProfileRow,
} from '../../features/admin/domain/adminUtils'
import {
  resolveTrainerOptions,
  toggleRoleSelection,
  type ProfileDraft,
} from '../../features/admin/domain/userProfiles'
import { GymClubSelector } from '../../components/GymClubSelector'

type UserProfileFormProps = {
  profile: AdminProfileRow
  draft: ProfileDraft
  users: User[]
  onUpdate: (patch: Partial<ProfileDraft>) => void
}

export function UserProfileForm({
  profile,
  draft,
  users,
  onUpdate,
}: UserProfileFormProps) {
  const getTrainerOptionsForProfile = (p: AdminProfileRow) =>
    resolveTrainerOptions(p, users)

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-sm font-medium text-slate-700">Roles</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {availableAdminRoles.map((role) => {
            const checked = draft.roles.includes(role)

            return (
              <label
                key={role}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-base font-medium text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    onUpdate({
                      roles: toggleRoleSelection(
                        draft.roles as UserRole[],
                        role,
                      ),
                    })
                  }}
                />
                <span className="capitalize">{role}</span>
              </label>
            )
          })}
        </div>
      </div>

      <label className="mt-3 block text-sm font-medium text-slate-700">
        Display name
        <input
          type="text"
          value={draft.name}
          onChange={(event) => onUpdate({ name: event.target.value })}
          className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        />
      </label>

      <label className="mt-3 block text-sm font-medium text-slate-700">
        Application name
        <input
          type="text"
          value={draft.applicationName ?? ''}
          onChange={(event) =>
            onUpdate({ applicationName: event.target.value })
          }
          placeholder="Enter a custom app name"
          className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        />
      </label>

      <label className="mt-3 block text-sm font-medium text-slate-700">
        Gym club (optional)
        <div className="mt-1">
          <GymClubSelector
            value={draft.gymClubId ?? draft.gymName ?? ''}
            onChange={(nextValue) =>
              onUpdate({
                gymClubId: nextValue,
                gymBrand: nextValue ? 'Virgin' : draft.gymBrand,
                gymName: nextValue || draft.gymName,
              })
            }
            placeholder="Search for club (Virgin only)"
          />
        </div>
      </label>

      <label className="mt-3 block text-sm font-medium text-slate-700">
        Account tier
        <select
          value={draft.accountTier}
          onChange={(event) =>
            onUpdate({
              accountTier: event.target.value as
                'free' | 'bronze' | 'silver' | 'gold',
            })
          }
          className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          <option value="free">Free</option>
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
        </select>
      </label>

      <label className="mt-3 block text-sm font-medium text-slate-700">
        Access end date
        <input
          type="date"
          value={draft.accessEndsAt ?? ''}
          onChange={(event) => onUpdate({ accessEndsAt: event.target.value })}
          className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        />
      </label>

      <label className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={draft.isFrozen}
          onChange={(event) => onUpdate({ isFrozen: event.target.checked })}
        />
        <span>Freeze account</span>
      </label>

      {draft.roles.includes('client') ? (
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Assigned trainer
          <select
            value={draft.trainerId ?? ''}
            onChange={(event) =>
              onUpdate({ trainerId: event.target.value || null })
            }
            className="mt-1 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">No trainer assigned</option>
            {getTrainerOptionsForProfile(profile).map((trainer) => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="mt-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={draft.mustChangePassword}
          onChange={(event) =>
            onUpdate({ mustChangePassword: event.target.checked })
          }
        />
        <span>Must change password</span>
      </label>
    </>
  )
}
