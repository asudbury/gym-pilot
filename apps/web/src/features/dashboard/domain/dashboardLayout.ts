import type { UserRole } from '@gym-pilot/types'

export type DashboardLayoutDefinition = {
  key: string
  label: string
  title: string
  description: string
  widgets: Array<{
    title: string
    description?: string
    to?: string
    tone?: 'blue' | 'default' | 'emerald' | 'orange' | 'rose' | 'white'
    icon?:
      | 'spark'
      | 'dumbbell'
      | 'search'
      | 'star'
      | 'chart'
      | 'lock'
      | 'grid'
      | 'heart'
      | 'clipboard'
      | 'shield'
      | 'calendar'
      | 'help'
      | 'tasks'
      | 'users'
      | 'database'
      | 'settings'
      | 'key'
      | 'user'
  }>
}

export type DashboardViewModel = {
  availableRoles: UserRole[]
  layouts: DashboardLayoutDefinition[]
  shouldShowRoleSelector: boolean
  selectedLayoutKey: string
}

export function resolveDashboardViewModel(
  userRole: string | undefined,
  userRoles: Array<string | undefined> | undefined,
): DashboardViewModel {
  const normalizedRoles =
    Array.isArray(userRoles) && userRoles.length
      ? userRoles.filter(
          (role): role is UserRole =>
            typeof role === 'string' &&
            ['admin', 'trainer', 'client', 'guest'].includes(role),
        )
      : []

  if (userRole && !normalizedRoles.includes(userRole as UserRole)) {
    normalizedRoles.push(userRole as UserRole)
  }

  const layouts = getDashboardLayoutDefinitions(normalizedRoles)

  return {
    availableRoles: normalizedRoles,
    layouts,
    shouldShowRoleSelector: layouts.length > 1 && normalizedRoles.length > 1,
    selectedLayoutKey: layouts[0]?.key ?? 'default',
  }
}

export function getDashboardLayoutDefinitions(
  userRoles: UserRole[],
): DashboardLayoutDefinition[] {
  const roles = new Set(userRoles)
  const layouts: DashboardLayoutDefinition[] = []

  if (roles.has('admin')) {
    layouts.push({
      key: 'admin',
      label: 'Admin',
      title: 'Admin workspace',
      description:
        'Manage users, access and app configuration from a central view.',
      widgets: [
        {
          title: 'Client management',
          description: 'Create and maintain user records and role assignments.',
          to: '/admin/users',
          tone: 'blue',
          icon: 'users',
        },
        {
          title: 'Admin tools',
          description: 'Jump into the main admin experience.',
          to: '/admin',
          tone: 'default',
          icon: 'settings',
        },
        {
          title: 'Database',
          description: 'Inspect the Supabase-backed data store.',
          to: '/admin/database',
          tone: 'default',
          icon: 'database',
        },
        {
          title: 'Preferences',
          description: 'Adjust application-wide preferences.',
          to: '/admin/preferences',
          tone: 'emerald',
          icon: 'settings',
        },
      ],
    })
  }

  if (roles.has('trainer')) {
    layouts.push({
      key: 'trainer',
      label: 'Trainer',
      title: 'Trainer workspace',
      description:
        'Monitor your clients, plans and assignments from one place.',
      widgets: [
        {
          title: 'Attendance history',
          description: 'Review and manage your recorded attendance entries.',
          to: '/attendance-history',
          tone: 'blue',
          icon: 'calendar',
        },
        {
          title: 'Timetable',
          description: 'Open your class timetable and upcoming sessions.',
          to: '/timetable',
          tone: 'default',
          icon: 'calendar',
        },
        {
          title: 'Client assignments',
          description: 'Review work assigned to your clients.',
          to: '/assignments',
          tone: 'default',
          icon: 'clipboard',
        },
        {
          title: 'Plans',
          description: 'Share and review training plans.',
          to: '/plans',
          tone: 'default',
          icon: 'tasks',
        },
        {
          title: 'Exercises',
          description: 'Search the exercise library for your next session.',
          to: '/exercises',
          tone: 'default',
          icon: 'dumbbell',
        },
        {
          title: 'Help',
          description: 'Find support and guidance.',
          to: '/help',
          tone: 'emerald',
          icon: 'help',
        },
      ],
    })
  }

  if (roles.has('client')) {
    layouts.push({
      key: 'client',
      label: 'Client',
      title: 'Client workspace',
      description:
        'Jump back into your exercises, plans and assignments from one place.',
      widgets: [
        {
          title: 'Class attendance history',
          description:
            'Review and manage your recorded class attendance entries.',
          to: '/attendance-history',
          tone: 'blue',
          icon: 'calendar',
        },
        {
          title: 'Timetable',
          description: 'Open your class timetable and upcoming sessions.',
          to: '/timetable',
          tone: 'default',
          icon: 'calendar',
        },
        {
          title: 'Exercises',
          description: 'Browse exercises and favourite your go-tos.',
          to: '/exercises',
          tone: 'default',
          icon: 'dumbbell',
        },
        {
          title: 'Plans',
          description: 'Review your training plans and keep momentum.',
          to: '/plans',
          tone: 'default',
          icon: 'tasks',
        },
        {
          title: 'Assignments',
          description: 'See the work assigned to you and stay on track.',
          to: '/assignments',
          tone: 'default',
          icon: 'clipboard',
        },
        {
          title: 'Help',
          description: 'Find guidance and support for the app.',
          to: '/help',
          tone: 'emerald',
          icon: 'help',
        },
      ],
    })
  }

  if (layouts.length === 0) {
    layouts.push({
      key: 'default',
      label: 'Default',
      title: 'Quick access',
      description: 'A simple starting point for your dashboard.',
      widgets: [
        {
          title: 'Exercises',
          description: 'Browse the library.',
          to: '/exercises',
          tone: 'blue',
          icon: 'dumbbell',
        },
        {
          title: 'Help',
          description: 'Find support and guidance.',
          to: '/help',
          tone: 'default',
          icon: 'help',
        },
      ],
    })
  }

  return layouts
}
