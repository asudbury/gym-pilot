import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { Panel } from '../../components/ui/Panel'
import { useAuth } from '../../auth/AuthContext'
import { helpSections } from '../../utils/helpUtils'
import { getBuildMetadata } from '../../utils/buildInfo'

export function HelpPage() {
  const { hasAccess } = useAuth()
  const buildMetadata = getBuildMetadata()
  const isAdmin = hasAccess('admin')

  return (
    <PageLayout>
      <PageCardLayout
        title="Help"
        subtitle="How to use the app"
        description="Find answers to common questions and learn how to use the app effectively"
      >
        <div className="flex flex-col gap-4">
          {helpSections.map((section) => (
            <Panel key={section.title} variant="muted" padding="md">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {section.items.map((item) => (
                  <li key={item} className="leading-6">
                    • {item}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}

          {isAdmin ? (
            <Panel variant="white" padding="md" className="text-sm text-slate-500">
              <p>App version: {buildMetadata.appVersion}</p>
              <p className="mt-1">Build: {buildMetadata.buildTimestamp}</p>
              <p className="mt-1">Commit: {buildMetadata.commitSha}</p>
              <p className="mt-1">Branch: {buildMetadata.branch}</p>
            </Panel>
          ) : null}
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
