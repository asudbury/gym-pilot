import type { UserRole } from '@gym-pilot/types'
import type { AppVisibilityRules } from '../components/appVisibility'

export type NavMetaItem = {
  key: string
  label: string
  to: string
  icon?: string
  requireAuth?: boolean
  requiredRole?: UserRole | UserRole[]
  requireClubId?: boolean
  visibility?: AppVisibilityRules
}

export const navigationMeta: NavMetaItem[] = [
  {
    key: 'exercises',
    label: 'Exercises',
    to: '/exercises',
    icon: 'dumbbell',
    requireAuth: true,
    visibility: {
      minTier: 'free',
      visibleOn: ['desktop', 'tablet', 'mobile'],
    },
  },
  // {
  //   key: 'plans',
  //   label: 'Plans',
  //   to: '/plans',
  //   icon: 'clipboard',
  //   requireAuth: true,
  // },
  // {
  //   key: 'assignments',
  //   label: 'Assignments',
  //   to: '/assignments',
  //   icon: 'tasks',
  //   requireAuth: true,
  // },
  {
    key: 'timetable',
    label: 'Timetable',
    to: '/timetable',
    icon: 'calendar',
    requireAuth: true,
    requireClubId: true,
    visibility: {
      minTier: 'free',
      visibleOn: ['desktop', 'tablet', 'mobile'],
    },
  },
  {
    key: 'preferences',
    label: 'Preferences',
    to: '/preferences',
    icon: 'settings',
    requireAuth: true,
    visibility: {
      minTier: 'free',
      visibleOn: ['desktop', 'tablet', 'mobile'],
    },
  },
  {
    key: 'admin',
    label: 'Admin',
    to: '/admin',
    icon: 'settings',
    requiredRole: 'admin',
    requireAuth: true,
    visibility: {
      minTier: 'free',
      visibleOn: ['desktop', 'tablet', 'mobile'],
    },
  },
  {
    key: 'help',
    label: 'Help',
    to: '/help',
    icon: 'help',
    visibility: {
      minTier: 'free',
      visibleOn: ['desktop', 'tablet', 'mobile'],
    },
  },
]
