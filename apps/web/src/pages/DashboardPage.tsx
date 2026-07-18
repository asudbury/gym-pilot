import { useEffect, useMemo, useState } from 'react'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { useAuth } from '../auth/AuthContext'
import { renderDashboardWidgets } from '../components/dashboard/dashboardLayouts'
import { formatDashboardTimestamp } from '../utils/appUtils'
import { resolveDashboardViewModel } from '../features/dashboard/domain/dashboardLayout'

type DashboardPageProps = {
  userName?: string | null
}

export function DashboardPage({ userName }: DashboardPageProps) {
  const { user } = useAuth()
  const displayName = userName?.trim() || 'there'
  const previousLoginLabel = formatDashboardTimestamp(user?.previousLastLoggedInAt ?? null)
  const viewModel = useMemo(() => resolveDashboardViewModel(user?.role, user?.roles), [user?.role, user?.roles])
  const [selectedRole, setSelectedRole] = useState<string | null>(() => user?.role ?? viewModel.availableRoles[0] ?? null)

  const layouts = viewModel.layouts
  const shouldShowRoleSelector = viewModel.shouldShowRoleSelector
  const selectedLayoutKey = selectedRole && layouts.some((layout) => layout.key === selectedRole)
    ? selectedRole
    : viewModel.selectedLayoutKey
  const selectedLayout = layouts.find((layout) => layout.key === selectedLayoutKey) ?? layouts[0]

  useEffect(() => {
    if (!layouts.some((layout) => layout.key === selectedRole)) {
      setSelectedRole(layouts[0]?.key ?? null)
    }
  }, [layouts, selectedRole])

  return (
    <PageLayout className="gap-6">
      <PageCard as="section" className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">Welcome back, {displayName}</h1>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Choose the view that fits your role and jump back into your work from one place.
          </p>
          {previousLoginLabel ? (
            <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Your last login: {previousLoginLabel}.
            </p>
          ) : null}
        </div>

        {shouldShowRoleSelector ? (
          <div className="flex flex-wrap gap-2">
            {layouts.map((layout) => {
              const isActive = selectedLayoutKey === layout.key
              return (
                <button
                  key={layout.key}
                  type="button"
                  onClick={() => setSelectedRole(layout.key)}
                  className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition ${isActive ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'}`}
                >
                  {layout.label}
                </button>
              )
            })}
          </div>
        ) : null}

        {selectedLayout ? (
          <div className="space-y-2">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{selectedLayout.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{selectedLayout.description}</p>
            </div>
            {renderDashboardWidgets(layouts, selectedLayoutKey)}
          </div>
        ) : null}
      </PageCard>
    </PageLayout>
  )
}
