import type { UserRole } from '@gym-pilot/types'

export type NavMetaItem = {
  key: string
  label: string
  to: string
  icon?: string
  requireAuth?: boolean
  requiredRole?: UserRole | UserRole[]
  requireClubId?: boolean
}

export const navigationMeta: NavMetaItem[] = [
  {
    key: 'exercises',
    label: 'Exercises',
    to: '/exercises',
    icon: 'dumbbell',
    requireAuth: true,
  },
  {
    key: 'plans',
    label: 'Plans',
    to: '/plans',
    icon: 'clipboard',
    requireAuth: true,
  },
  {
    key: 'assignments',
    label: 'Assignments',
    to: '/assignments',
    icon: 'tasks',
    requireAuth: true,
  },
  {
    key: 'timetable',
    label: 'Timetable',
    to: '/timetable',
    icon: 'calendar',
    requireAuth: true,
    requireClubId: true,
  },
  {
    key: 'preferences',
    label: 'Preferences',
    to: '/preferences',
    icon: 'settings',
    requireAuth: true,
  },
  {
    key: 'admin',
    label: 'Admin',
    to: '/admin',
    icon: 'settings',
    requiredRole: 'admin',
    requireAuth: true,
  },
  { key: 'help', label: 'Help', to: '/help', icon: 'help' },
]
