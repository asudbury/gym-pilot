import { PageLayout } from '../../layouts/PageLayout'
import { buildAdminActionCards, adminCards } from '../../utils/adminUtils'

export function AdminPage() {

  return <PageLayout>{buildAdminActionCards(adminCards)}</PageLayout>
}
