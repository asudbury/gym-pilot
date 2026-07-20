import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { useAuth } from '../auth/AuthContext'
import { renderDashboardWidgets } from '../components/dashboard/dashboardLayouts'
import { renderDashboardTimestamp } from '../utils/appUtils'
import { resolveDashboardViewModel } from '../features/dashboard/domain/dashboardLayout'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import { Button } from '../components/Button'
import BookingModal from '../components/BookingModal'

export function DashboardPage() {
  const { user } = useAuth()
  const previousLoginTimestamp = user?.previousLastLoggedInAt ?? null
  const viewModel = useMemo(
    () => resolveDashboardViewModel(user?.role, user?.roles),
    [user?.role, user?.roles],
  )
  const [selectedRole, setSelectedRole] = useState<string | null>(
    () => user?.role ?? viewModel.availableRoles[0] ?? null,
  )

  const layouts = viewModel.layouts
  const shouldShowRoleSelector = viewModel.shouldShowRoleSelector
  const selectedLayoutKey =
    selectedRole && layouts.some((layout) => layout.key === selectedRole)
      ? selectedRole
      : viewModel.selectedLayoutKey

  // If the user does not have a gym/club id (stored in `gymName`), hide
  // timetable and attendance widgets which require a club context.
  const canShowTimetable = Boolean(user?.gymName && user.gymName.trim())

  const filteredLayouts = layouts.map((layout) => ({
    ...layout,
    widgets: layout.widgets.filter((widget) => {
      if (canShowTimetable) return true
      const path = widget.to ?? ''
      if (path === '/timetable' || path === '/attendance-history') {
        return false
      }
      return true
    }),
  }))

  const filteredSelectedLayout =
    filteredLayouts.find((layout) => layout.key === selectedLayoutKey) ??
    filteredLayouts.find((layout) => layout.widgets.length > 0) ??
    filteredLayouts[0]

  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingInitialType, setBookingInitialType] = useState<
    'solo' | 'personal_training' | null
  >(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!layouts.some((layout) => layout.key === selectedRole)) {
      setSelectedRole(layouts[0]?.key ?? null)
    }
  }, [layouts, selectedRole])

  return (
    <PageLayout className="gap-6">
      <PageCard as="section" className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-start gap-2">
            <div className="inline-flex items-center gap-2">
              <DecorativeIcon icon="chart" />
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600 dark:text-slate-300">
                Dashboard
              </p>
            </div>
            <div className="flex flex-col items-start">
              {previousLoginTimestamp ? (
                <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  Your last login:{' '}
                  {renderDashboardTimestamp(previousLoginTimestamp)}.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {shouldShowRoleSelector ? (
          <div className="flex flex-wrap gap-2">
            {filteredLayouts
              .filter((l) => l.widgets.length > 0)
              .map((layout) => {
                const isActive = selectedLayoutKey === layout.key
                return (
                  <Button
                    key={layout.key}
                    type="button"
                    onClick={() => setSelectedRole(layout.key)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${isActive ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}
                  >
                    {layout.label}
                  </Button>
                )
              })}
          </div>
        ) : null}

        <div className="mt-4">
          <PageCard as="section">
            <div className="mb-1 flex items-start gap-3">
              <DecorativeIcon icon="calendar" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Record a session
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Easily record a class, personal training session, or a solo
                  session.
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <Button
                tone="emerald"
                onClick={() => navigate('/timetable?prefill=class')}
              >
                <div className="inline-flex items-center gap-2">
                  <DecorativeIcon icon="calendar" className="h-4 w-4" />
                  <span>Record class</span>
                </div>
              </Button>

              <Button
                tone="emerald"
                onClick={() => {
                  setBookingInitialType('personal_training')
                  setShowBookingModal(true)
                }}
              >
                <div className="inline-flex items-center gap-2">
                  <DecorativeIcon icon="users" className="h-4 w-4" />
                  <span>Record personal training</span>
                </div>
              </Button>

              <Button
                tone="emerald"
                onClick={() => {
                  setBookingInitialType('solo')
                  setShowBookingModal(true)
                }}
              >
                <div className="inline-flex items-center gap-2">
                  <DecorativeIcon icon="dumbbell" className="h-4 w-4" />
                  <span>Record solo session</span>
                </div>
              </Button>
            </div>
          </PageCard>
        </div>

        {filteredSelectedLayout ? (
          <div className="space-y-2">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {filteredSelectedLayout.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {filteredSelectedLayout.description}
              </p>
            </div>
            {renderDashboardWidgets(filteredLayouts, selectedLayoutKey)}
          </div>
        ) : null}
        {showBookingModal ? (
          <BookingModal
            open={showBookingModal}
            onClose={() => {
              setShowBookingModal(false)
              setBookingInitialType(null)
            }}
            initialSessionType={bookingInitialType ?? undefined}
          />
        ) : null}
      </PageCard>
    </PageLayout>
  )
}
