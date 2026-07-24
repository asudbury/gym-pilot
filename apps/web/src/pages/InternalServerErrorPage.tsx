import { Link } from 'react-router-dom'
import { PageLayout } from '../layouts/PageLayout'
import { getToneClass } from '../components/toneClasses'

export function InternalServerErrorPage() {
  return (
    <PageLayout goHomeLink={false}>
      <div className="text-center">
        <h1 className="text-6xl font-bold">500</h1>
        <p className="text-2xl">Internal Server Error</p>
        <p className="mt-4 mb-4">
          Something went wrong on our end. Please try again later.
        </p>
        <Link to="/" className={getToneClass('blue')}>
          Go Home
        </Link>
      </div>
    </PageLayout>
  )
}
