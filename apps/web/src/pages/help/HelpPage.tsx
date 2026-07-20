import { PageLayout } from '../../layouts/PageLayout'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { Panel } from '../../components/ui/Panel'
import { useAuth } from '../../auth/AuthContext'
import { helpSections } from '../../utils/helpUtils'
import { Link } from 'react-router-dom'
import { getBuildMetadata } from '../../utils/buildInfo'

export function HelpPage() {
  const { hasAccess, user, isAuthenticated } = useAuth()
  const buildMetadata = getBuildMetadata()
  const isAdmin = hasAccess('admin')
  const isTrainer = hasAccess('trainer')
  const isClient = hasAccess('client')

  const quickStartItems = isAdmin
    ? [
        // {
        //   title: 'Manage users',
        //   description:
        //     'Review accounts, roles, and access so the right people can reach the right tools.',
        // },
        // {
        //   title: 'Administer plans',
        //   description:
        //     'Create or update shared plans and keep the content organised for the wider team.',
        // },
        // {
        //   title: 'Review assignments',
        //   description:
        //     'Check progress, edit assignments, and export the latest versions when needed.',
        // },
        // {
        //   title: 'Inspect records',
        //   description:
        //     'Use the database view to review the stored data behind the experience.',
        // },
      ]
    : isTrainer
      ? [
          {
            title: 'Build plans',
            description:
              'Create workout templates with tabs, notes, and structured sections.',
          },
          {
            title: 'Assign work',
            description:
              'Share plans with clients or colleagues through assignments.',
          },
          {
            title: 'Review progress',
            description:
              'Open assignments to check details, edit content, and export them for sharing.',
          },
          {
            title: 'Check the timetable',
            description:
              'View upcoming sessions and filter by instructor or class.',
          },
        ]
      : isClient
        ? [
            {
              title: 'View assignments',
              description:
                'Open the work assigned to you and stay on top of what is due next.',
            },
            {
              title: 'Browse exercises',
              description:
                'Search by name or type and save your favourites for later.',
            },
            {
              title: 'Use favourites',
              description:
                'Keep your most-used exercises easy to find with your saved favourites.',
            },
            {
              title: 'Check the timetable',
              description: 'Look up upcoming sessions and plan around them.',
            },
          ]
        : [
            {
              title: 'Browse exercises',
              description:
                'Search by name or type and save your favourites for later.',
            },
            {
              title: 'Use favourites',
              description:
                'Keep your most-used exercises easy to find with your saved favourites.',
            },
            {
              title: 'Explore plans',
              description:
                'See how plans and assignments are organised before signing in more fully.',
            },
            {
              title: 'Ask for access',
              description:
                'If you need more features, contact an admin or trainer to request the right role.',
            },
          ]

  return (
    <PageLayout>
      <PageCardLayout
        title="Help"
        subtitle="How to use the app"
        description="Find answers to common questions and learn how to use the app effectively"
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {quickStartItems.map((item) => (
              <Panel
                key={item.title}
                variant="muted"
                padding="md"
                className="h-full"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </Panel>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {helpSections.map((section) => (
              <Panel key={section.title} variant="muted" padding="md">
                <h2 className="text-lg font-semibold text-slate-900">
                  {section.title}
                </h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {section.items.map((item) => (
                    <li key={item} className="leading-6">
                      • {item}
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
          <Panel variant="white" padding="md">
            <h3 className="text-sm font-semibold">Install on iPhone</h3>
            <p className="mt-2 text-sm text-slate-600">
              For a native-like experience on iOS, add Gym-Pilot to your Home
              Screen. See the{' '}
              <Link to="/help/install-ios" className="text-emerald-600">
                iOS install guide
              </Link>{' '}
              for step-by-step instructions.
            </p>
          </Panel>
          <Panel variant="white" padding="md">
            {isAuthenticated && user ? (
              <>
                <h3 className="text-sm font-semibold">Roles</h3>
                <p className="mt-2">
                  {Array.isArray(user.roles) && user.roles.length > 0
                    ? user.roles.join(', ')
                    : user.role
                      ? String(user.role)
                      : 'None'}
                </p>
              </>
            ) : null}
            <br />
            <p>App version: {buildMetadata.appVersion}</p>
            <p className="mt-1">Build: {buildMetadata.buildTimestamp}</p>
          </Panel>
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
