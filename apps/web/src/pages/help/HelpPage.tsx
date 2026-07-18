import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { helpSections } from '../../utils/helpUtils'
import { getBuildMetadata } from '../../utils/buildInfo'

export function HelpPage() {
  const buildMetadata = getBuildMetadata()

  return (
    <PageLayout>
      <PageCardLayout
        title="Help"
        subtitle="How to use the app"
        description="Find answers to common questions and learn how to use the app effectively"
      >
        <div className="flex flex-col gap-4">
          {helpSections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {section.items.map((item) => (
                  <li key={item} className="leading-6">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            <p>App version: {buildMetadata.appVersion}</p>
            <p className="mt-1">Build: {buildMetadata.buildTimestamp}</p>
            <p className="mt-1">Commit: {buildMetadata.commitSha}</p>
            <p className="mt-1">Branch: {buildMetadata.branch}</p>
          </div>
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
