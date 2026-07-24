import { PageLayout } from '../layouts/PageLayout'
import { PageCard } from '../components/PageCard'
import { Heading1, Paragraph } from '../components/Typography'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import { BackLink } from '../components/ui/BackLink'

export function SessionTemplateCreatePage() {
  return (
    <PageLayout className="max-w-4xl">
      <PageCard padding="spacious">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <DecorativeIcon icon="clipboard" />{' '}
            {/* Changed from 'tasks' to 'clipboard' */}
            <div>
              <Paragraph>Session Templates</Paragraph>
              <Heading1 className="mt-2">Create Workout Template</Heading1>
            </div>
          </div>
          <BackLink to="/" label="Back to Dashboard" />
        </div>

        <div className="mt-6 text-center text-lg text-slate-600">
          <p>Coming Soon!</p>
          <p className="mt-2 text-sm text-slate-500">
            This feature is under development. Please check back later.
          </p>
        </div>
      </PageCard>
    </PageLayout>
  )
}

export default SessionTemplateCreatePage
