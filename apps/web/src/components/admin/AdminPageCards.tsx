import { Link } from 'react-router-dom'
import { CallToAction } from '../../layouts/CallToAction'
import { getToneClass } from '../toneClasses'
import { type AdminActionCard } from '../../features/admin/domain/adminUtils'

type AdminPageCardsProps = {
  cards: AdminActionCard[]
}

export function AdminPageCards({ cards }: AdminPageCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => (
        <CallToAction
          key={card.href}
          title={card.title}
          description={card.description}
          action={
            <Link
              to={card.href}
              className={getToneClass(
                'blue',
                'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium',
              )}
            >
              {card.label}
            </Link>
          }
        />
      ))}
    </div>
  )
}
