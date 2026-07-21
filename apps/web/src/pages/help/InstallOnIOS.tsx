import { useEffect } from 'react'
import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { Panel } from '../../components/ui/Panel'
import { Paragraph } from '../../components/Typography'
import { BackLink } from '../../components/ui/BackLink'
import { useAuth } from '../../auth/AuthContext'
import { recordSupabaseUserActivity } from '@gym-pilot/shared'
import { buildInstallIosPageActivity } from './installIosActivity'

export function InstallOnIOSPage() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const activity = buildInstallIosPageActivity()

    void recordSupabaseUserActivity(
      activity.eventType,
      activity.eventData,
      user.id,
      user.name || user.email || null,
    )
  }, [user?.id, user?.name, user?.email])

  return (
    <PageLayout>
      <PageCardLayout
        title="Install Gym-Pilot on iPhone (iOS)"
        subtitle="Turn Gym-Pilot into an app on your Home Screen"
        description="Step-by-step, mobile-friendly guidance for adding Gym-Pilot to your iPhone Home Screen."
      >
        <div className="flex flex-col gap-4">
          <Panel variant="white" padding="md">
            <Paragraph>Step-by-step guide</Paragraph>
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

            <p className="text-sm text-slate-600">
              <BackLink
                to="/help"
                label="Back to help"
                variant="inline"
                className="text-emerald-600"
              />
            </p>

        </div>
      </PageCardLayout>
    </PageLayout>
  )
}

export default InstallOnIOSPage
