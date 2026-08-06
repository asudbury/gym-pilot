import { Link } from 'react-router-dom';
import { type AdminActionCard } from '../../features/admin/domain/adminUtils';
import { CallToAction } from '../../layouts/CallToAction';
import { Button } from '../ui/Button';

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
          action={<Button as={Link} to={card.href} tone="blue">{card.label}</Button>}
        />
      ))}
    </div>
  )
}
