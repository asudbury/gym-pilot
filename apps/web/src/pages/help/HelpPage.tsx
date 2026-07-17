import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { helpSections } from '../../utils/helpUtils'

export function HelpPage() {
  return (
    <PageLayout>
      <PageCardLayout
        title="Help"
        subtitle="How to use GymPilot"
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
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
