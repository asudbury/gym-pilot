import { Link } from 'react-router-dom'
import { getToneClass } from '../components/toneClasses'
import { CallToAction } from '../components/CallToAction'

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

export function buildAdminActionCards(cards: AdminActionCard[]) {
  return cards.map((card) => (
    <CallToAction
      key={card.href}
      title={card.title}
      description={card.description}
      action={
        <Link to={card.href} className={getToneClass('blue', 'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium')}>
          {card.label}
        </Link>
      }
    />
  ))
}
