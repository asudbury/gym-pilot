import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { buildAdminActionCards, adminCards } from '../../utils/adminUtils'

export function AdminPage() {
  return (
    <PageLayout>
      <PageCardLayout
        title='Admin'
        subtitle='Admin Dashboard'
      >
        <div className="flex flex-col gap-4">{buildAdminActionCards(adminCards)}</div>
      </PageCardLayout>
    </PageLayout>
  )
}
