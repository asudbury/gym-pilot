import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { adminCards, type AdminActionCard } from '../../utils/adminUtils'
import { Link } from 'react-router-dom'
import { CallToAction } from '../../layouts/CallToAction'
import { getToneClass } from '../../components/toneClasses'

/// TODO : do we move somewhere else???
function buildAdminActionCards(cards: AdminActionCard[]) {
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
export function AdminPage() {
  return (
    <PageLayout>
      <PageCardLayout
        title='Admin'
        subtitle='Admin Dashboard'
      >
        <div className="grid gap-4 md:grid-cols-2">{buildAdminActionCards(adminCards)}</div>
      </PageCardLayout>
    </PageLayout>
  )
}
