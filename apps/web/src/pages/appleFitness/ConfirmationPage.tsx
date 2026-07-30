import { Link } from 'react-router-dom'
import { getToneClass } from '../../components/toneClasses'
import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'

export function ConfirmationPage() {
  return (
    <PageLayout goHomeLink={true}>
      <PageCardLayout
        title="Import Confirmation"
        icon="calendar"
        className="mb-4"
      >
        <div>
          <p className="text-2xl">Import Successful</p>
          <p className="mt-4 mb-4">
            Your have successfully imported your Apple Fitness data
          </p>
          <div className="pb-4 pt-4">
            <Link
              to="/apple-fitness/dashboard"
              className={getToneClass('emerald')}
            >
              View Apple Fitness Dashboard
            </Link>
          </div>
          <div className="pt-4 pb-4">
            <Link to="/apple-fitness" className={getToneClass('blue')}>
              Import another file
            </Link>
          </div>
          <div className="pt-4 pb-4">
            <Link to="/" className={getToneClass('blue')}>
              Go Home
            </Link>
          </div>
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
