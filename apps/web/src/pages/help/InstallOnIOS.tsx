import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { Panel } from '../../components/ui/Panel'
import { Heading1 } from '../../components/Typography'
import { Link } from 'react-router-dom'

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
            <h2 className="text-base font-semibold">Step-by-step (text)</h2>
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
                Enjoy Gym‑Pilot in a native-like, browser‑chrome‑free
                experience.
              </li>
            </ol>
          </Panel>

          <Panel variant="muted" padding="md">
            <h3 className="text-sm font-semibold">Tips</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li>
                Use Safari — other browsers on iOS do not support the Home
                Screen shortcut.
              </li>
              <li>
                If you want to see where the Share control is, jump to the
                <Link to="#share-indicator" className="text-emerald-600">
                  {' '}
                  share indicator
                </Link>{' '}
                below.
              </li>
              <li>
                After adding, Gym-Pilot runs without the browser chrome for a
                more native feel.
              </li>
            </ul>
          </Panel>

          <div id="share-indicator" className="pt-2">
            <Panel variant="muted" padding="md">
              <h4 className="text-sm font-semibold">
                Share indicator (visual)
              </h4>
              <p className="mt-2 text-sm text-slate-600">
                On iPhone Safari the Share control looks like a square with an
                arrow pointing up — normally shown at the bottom of the screen.
                Tap it to open the share sheet and choose Add to Home Screen.
              </p>
            </Panel>
          </div>

          <Panel variant="white" padding="md">
            <p className="text-sm text-slate-600">
              Back to{' '}
              <Link to="/help" className="text-emerald-600">
                Help
              </Link>
            </p>
          </Panel>
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}

export default InstallOnIOSPage
