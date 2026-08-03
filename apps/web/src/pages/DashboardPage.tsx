import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { PageCard } from '../components/PageCard';
import SessionActions from '../components/SessionActions';
import { DecorativeIcon } from '../components/ui/DecorativeIcon';
import WorkoutCalendar from '../components/WorkoutCalendar';
import { resolveDashboardViewModel } from '../features/dashboard/domain/dashboardLayout';
import { useImportedWorkouts } from '../hooks/useImportedWorkouts';
import { PageLayout } from '../layouts/PageLayout';

export function DashboardPage() {
  const { user } = useAuth()
  const viewModel = useMemo(
    () => resolveDashboardViewModel(user?.role, user?.roles),
    [user?.role, user?.roles],
  )
  const [selectedRole, setSelectedRole] = useState<string | null>(
    () => user?.role ?? viewModel.availableRoles[0] ?? null,
  )

  const layouts = viewModel.layouts

  const canShowTimetable = Boolean(user?.gymName && user.gymName.trim())
  const hasTrainerConfigured = Boolean(user?.trainerId?.trim())
  const isTrainer = Boolean(user?.roles?.includes('trainer'))

  const { workouts } = useImportedWorkouts()

  // const filteredLayouts = layouts.map((layout) => ({
  //   ...layout,
  //   widgets: layout.widgets.filter((widget) => {
  //     if (canShowTimetable) return true
  //     const path = widget.to ?? ''
  //     if (path === '/timetable' || path === '/sessions') {
  //       return false
  //     }
  //     return true
  //   }),
  // }))

  // const filteredSelectedLayout =
  //   filteredLayouts.find((layout) => layout.key === selectedLayoutKey) ??
  //   filteredLayouts.find((layout) => layout.widgets.length > 0) ??
  //   filteredLayouts[0]

  useEffect(() => {
    if (!layouts.some((layout) => layout.key === selectedRole)) {
      setSelectedRole(layouts[0]?.key ?? null)
    }
  }, [layouts, selectedRole])

  return (
    <PageLayout className="w-full gap-6">
      <PageCard as="section" className="w-full space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-start gap-2">
            <div className="inline-flex items-center gap-2 pl-2">
              <DecorativeIcon icon="chart" />
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-600 dark:text-slate-300">
                Dashboard
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <PageCard as="section" className="w-full">
            {(() => {
              const sessionActionsProps = {
                showViewSessionsButton: true,
                showClassSessionAction: canShowTimetable, // This will now navigate to /sessions/new?type=class
                showPTSessionAction: hasTrainerConfigured || isTrainer,
                showViewWorkoutsTemplateButton: true,
              }
              return (
                <>
                  <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
                    <div className="flex-1">
                      <SessionActions {...sessionActionsProps} />
                    </div>
                  </div>
                  <div className="lg:hidden">
                    <SessionActions {...sessionActionsProps} />
                  </div>
                </>
              )
            })()}
            {workouts.length > 0 && <WorkoutCalendar workouts={workouts} />}
          </PageCard>
        </div>

       </PageCard>
    </PageLayout>
  )
}
