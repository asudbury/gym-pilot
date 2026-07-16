import { Paragraph, Heading1 } from '../../components/Typography'
import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { buildAdminActionCards, adminCards } from '../../utils/adminUtils'

export function AdminPage() {
  return (
    <PageLayout>
      <PageCardLayout
        title={
          <div>
            <Paragraph>Admin</Paragraph>
            <Heading1 className="mt-2">Admin Dashboard</Heading1>
          </div>
        }
      >
        <div className="flex flex-col gap-4">{buildAdminActionCards(adminCards)}</div>
      </PageCardLayout>
    </PageLayout>
  )
}
