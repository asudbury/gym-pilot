import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { adminCards } from '../../utils/adminUtils'
import { AdminPageCards } from '../../components/admin/AdminPageCards'

export function AdminPage() {
  return (
    <PageLayout>
      <PageCardLayout title="Admin" subtitle="Admin Dashboard">
        <AdminPageCards cards={adminCards} />
      </PageCardLayout>
    </PageLayout>
  )
}
