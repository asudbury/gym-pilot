import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { PageLayout } from '../../layouts/PageLayout'

export function InternalServerErrorPage() {
  return (
    <PageLayout>
      <div className="text-center">
        <h1 className="text-6xl font-bold">500</h1>
        <p className="text-2xl">Internal Server Error</p>
        <p className="mt-4 mb-4">
          Something went wrong on our end. Please try again later.
        </p>
        <Button as={Link} to="/" tone="blue">
          Go Home
        </Button>
      </div>
    </PageLayout>
  )
}
