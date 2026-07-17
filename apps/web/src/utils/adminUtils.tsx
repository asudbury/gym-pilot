export type AdminActionCard = {
  title: string
  description: string
  href: string
  label: string
}

export const adminCards: AdminActionCard[] = [
    {
      title: 'Preferences',
      description: 'Manage your preferences.',
      href: '/admin/preferences',
      label: 'Preferences',
    },
    {
      title: 'Manage users',
      description: 'Add, edit, or remove users from the application.',
      href: '/admin/users',
      label: 'Manage users',
    },
    {
      title: 'Database',
      description: "Manage the application's database.",
      href: '/admin/database',
      label: 'Database',
    },
]
