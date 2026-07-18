import type { UserRole } from '@gym-pilot/types'
import { createElement, type ReactNode } from 'react'
import { DashboardWidget } from './DashboardWidget'

type DashboardLayoutDefinition = {
  key: string
  label: string
  title: string
  description: string
  widgets: Array<{
    title: string
    description?: string
    to?: string
    tone?: 'blue' | 'default' | 'emerald' | 'orange' | 'rose' | 'white'
    children?: ReactNode
  }>
}

export function getDashboardLayoutDefinitions(userRoles: UserRole[]): DashboardLayoutDefinition[] {
  const roles = new Set(userRoles)
  const layouts: DashboardLayoutDefinition[] = []

  if (roles.has('admin')) {
    layouts.push({
      key: 'admin',
      label: 'Admin',
      title: 'Admin workspace',
      description: 'Manage users, access and app configuration from a central view.',
      widgets: [
        { title: 'Client management', description: 'Create and maintain user records and role assignments.', to: '/admin/users', tone: 'blue' },
        { title: 'Admin tools', description: 'Jump into the main admin experience.', to: '/admin', tone: 'default' },
        { title: 'Database', description: 'Inspect the Supabase-backed data store.', to: '/admin/database', tone: 'default' },
        { title: 'Preferences', description: 'Adjust application-wide preferences.', to: '/admin/preferences', tone: 'emerald' },
      ],
    })
  }

  if (roles.has('trainer')) {
    layouts.push({
      key: 'trainer',
      label: 'Trainer',
      title: 'Trainer workspace',
      description: 'Monitor your clients, plans and assignments from one place.',
      widgets: [
        { title: 'Client assignments', description: 'Review work assigned to your clients.', to: '/assignments', tone: 'blue' },
        { title: 'Plans', description: 'Share and review training plans.', to: '/plans', tone: 'default' },
        { title: 'Exercises', description: 'Search the exercise library for your next session.', to: '/exercises', tone: 'default' },
        { title: 'Help', description: 'Find support and guidance.', to: '/help', tone: 'emerald' },
      ],
    })
  }

  if (roles.has('client')) {
    layouts.push({
      key: 'client',
      label: 'Client',
      title: 'Client workspace',
      description: 'Jump back into your exercises, plans and assignments from one place.',
      widgets: [
        { title: 'Exercises', description: 'Browse exercises and favourite your go-tos.', to: '/exercises', tone: 'blue' },
        { title: 'Plans', description: 'Review your training plans and keep momentum.', to: '/plans', tone: 'default' },
        { title: 'Assignments', description: 'See the work assigned to you and stay on track.', to: '/assignments', tone: 'default' },
        { title: 'Help', description: 'Find guidance and support for the app.', to: '/help', tone: 'emerald' },
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
        { title: 'Exercises', description: 'Browse the library.', to: '/exercises', tone: 'blue' },
        { title: 'Help', description: 'Find support and guidance.', to: '/help', tone: 'default' },
      ],
    })
  }

  return layouts
}

export function renderDashboardWidgets(layouts: DashboardLayoutDefinition[], selectedLayoutKey: string) {
  const selectedLayout = layouts.find((layout) => layout.key === selectedLayoutKey) ?? layouts[0]

  if (!selectedLayout) {
    return null
  }

  return createElement(
    'div',
    { className: 'grid gap-4 md:grid-cols-2' },
    ...selectedLayout.widgets.map((widget, index) => createElement(DashboardWidget, { key: `${widget.title}-${index}`, ...widget })),
  )
}
