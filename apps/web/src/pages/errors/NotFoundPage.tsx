import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { PageLayout } from '../../layouts/PageLayout'

export function NotFoundPage() {
  return (
    <PageLayout>
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-2xl">Page Not Found</p>
        <p className="mt-4 mb-4">
          The page you are looking for does not exist.
        </p>
        <Button as={Link} to="/" tone="blue">
          Go Home
        </Button>
      </div>
    </PageLayout>
  )
}
