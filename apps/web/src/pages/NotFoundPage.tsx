import { Link } from 'react-router-dom'
import { PageLayout } from '../layouts/PageLayout'
import { getToneClass } from '../components/toneClasses'

export function NotFoundPage() {
  return (
    <PageLayout goHomeLink={false}>
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-2xl">Page Not Found</p>
        <p className="mt-4 mb-4">
          The page you are looking for does not exist.
        </p>
        <Link to="/" className={getToneClass('blue')}>
          Go Home
        </Link>
      </div>
    </PageLayout>
  )
}
