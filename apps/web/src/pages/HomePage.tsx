import { Link } from 'react-router-dom'
import { PageCard } from '../components/PageCard'
import { Button } from '../components/ui/Button'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import { PageLayout } from '../layouts/PageLayout'

export function HomePage() {
  return (
    <PageLayout className="gap-6">
      <PageCard
        as="section"
        className="relative overflow-hidden border-blue-200/70 bg-gradient-to-br from-white via-blue-50/70 to-violet-100/70 dark:border-blue-700/70 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/40"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-300/35 blur-3xl dark:bg-blue-600/30" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-violet-300/30 blur-3xl dark:bg-violet-700/30" />
        <div className="relative space-y-6">
          <div className="flex items-start gap-3">
            <DecorativeIcon icon="spark" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Gym Pilot
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                Train smarter with plans, sessions, and guided exercises.
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-base text-slate-700 dark:text-slate-200">
            Build better workouts with a clean workflow for browsing exercise
            cues, tracking sessions, and staying consistent week to week.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              as={Link}
              to="/exercises"
              tone="blue"
              className="px-5 py-2.5 text-sm sm:text-base"
            >
              Explore exercises
            </Button>
            <Button
              as={Link}
              to="/help"
              tone="white"
              className="px-5 py-2.5 text-sm sm:text-base"
            >
              Learn more
            </Button>
          </div>
        </div>
      </PageCard>

      <PageCard as="section" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="mb-2 flex items-center gap-2">
            <DecorativeIcon icon="dumbbell" />
            <p className="font-semibold">Exercise library</p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Search movements quickly and open clear step-by-step instructions.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="mb-2 flex items-center gap-2">
            <DecorativeIcon icon="calendar" />
            <p className="font-semibold">Session flow</p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Keep your routine organized with plans, sessions, and timetable
            support.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="mb-2 flex items-center gap-2">
            <DecorativeIcon icon="star" />
            <p className="font-semibold">Built for consistency</p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Save favourites and keep momentum with fast access to what you use
            most.
          </p>
        </div>
      </PageCard>
    </PageLayout>
  )
}
