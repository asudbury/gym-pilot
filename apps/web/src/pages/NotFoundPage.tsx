import { Link } from 'react-router-dom'
import { PageLayout } from '../layouts/PageLayout'

export function NotFoundPage() {
  return (
    <PageLayout goHomeLink={false}>
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-2xl">Page Not Found</p>
        <p className="mt-4">The page you are looking for does not exist.</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
        >
          Go Home
        </Link>
      </div>
    </PageLayout>
  )
}
