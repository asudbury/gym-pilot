import { NavLink } from 'react-router-dom'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { getToneClass } from '../components/toneClasses'

type DashboardPageProps = {
  userName?: string | null
}

type DashboardCard = {
  title: string
  description: string
  to: string
  tone: 'blue' | 'default' | 'emerald'
}

const dashboardCards: DashboardCard[] = [
  {
    title: 'Exercises',
    description: 'Browse exercises and favourite your go-tos.',
    to: '/exercises',
    tone: 'blue',
  },
  {
    title: 'Plans',
    description: 'Review your training plans and keep momentum.',
    to: '/plans',
    tone: 'default',
  },
  {
    title: 'Assignments',
    description: 'See the work assigned to you and stay on track.',
    to: '/assignments',
    tone: 'default',
  },
  {
    title: 'Help',
    description: 'Find guidance and support for the app.',
    to: '/help',
    tone: 'emerald',
  },
]

export function DashboardPage({ userName }: DashboardPageProps) {
  const displayName = userName?.trim() || 'there'

  return (
    <PageLayout className="gap-6">
      <PageCard as="section" className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Welcome back, {displayName}</h1>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Jump back into your exercises, plans and assignments from one place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {dashboardCards.map((card) => (
            <NavLink
              key={card.to}
              to={card.to}
              className={getToneClass(card.tone, 'rounded-3xl border border-white/70 bg-white/70 p-5 text-left shadow-[0_12px_30px_-18px_rgba(15,23,42,0.24)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-18px_rgba(15,23,42,0.28)]')}
            >
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{card.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{card.description}</p>
              </div>
            </NavLink>
          ))}
        </div>
      </PageCard>
    </PageLayout>
  )
}
