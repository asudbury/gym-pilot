import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { Panel } from '../../components/ui/Panel'
import { Heading1 } from '../../components/Typography'
import { BackLink } from '../../components/ui/BackLink'

export function InstallOnIOSPage() {
  return (
    <PageLayout>
      <PageCardLayout
        title="Install Gym-Pilot on iPhone (iOS)"
        subtitle="Turn Gym-Pilot into an app on your Home Screen"
        description="Step-by-step, mobile-friendly guidance for adding Gym-Pilot to your iPhone Home Screen."
      >
        <div className="flex flex-col gap-4">
          <Panel variant="muted" padding="md">
            <Heading1 as="h1">Install on iPhone</Heading1>
            <p className="mt-2 text-sm text-slate-600">
              Follow these steps in Safari on iOS to add Gym-Pilot to your Home
              Screen — this provides a stand-alone app-like experience.
            </p>
          </Panel>

          <Panel variant="white" padding="md">
            <h2 className="text-base font-semibold">Step-by-step guide</h2>
            <ol className="mt-3 list-decimal pl-5 text-sm leading-7 text-slate-700">
              <li>
                Open Gym‑Pilot in <strong>Safari</strong> on your iPhone.
              </li>
              <li className="mt-2">
                Tap the <strong>Share</strong> button (square with an up-arrow)
                at the bottom of the screen.
              </li>
              <li className="mt-2">
                In the share sheet, scroll the action list and choose{' '}
                <strong>Add to Home Screen</strong>.
              </li>
              <li className="mt-2">
                Edit the name if you wish, then tap <strong>Add</strong> in the
                top-right.
              </li>
              <li className="mt-2">
                The Gym‑Pilot icon will now appear on your Home Screen — tap it
                to open the app in a standalone view.
              </li>
              <li className="mt-2">
                Enjoy Gym‑Pilot in a native-like, browser free experience.
              </li>
            </ol>
          </Panel>

          <Panel variant="white" padding="md">
            <p className="text-sm text-slate-600">
              <BackLink
                to="/help"
                label="Back to help"
                variant="inline"
                className="text-emerald-600"
              />
            </p>
          </Panel>
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}

export default InstallOnIOSPage
