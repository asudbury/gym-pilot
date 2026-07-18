import { createElement } from 'react'
import { DashboardWidget } from './DashboardWidget'
import type { DashboardLayoutDefinition } from '../../features/dashboard/domain/dashboardLayout'

export function renderDashboardWidgets(layouts: DashboardLayoutDefinition[], selectedLayoutKey: string) {
  const selectedLayout = layouts.find((layout) => layout.key === selectedLayoutKey) ?? layouts[0]

  if (!selectedLayout) {
    return null
  }

  return createElement(
    'div',
    { className: 'grid gap-4 md:grid-cols-2' },
    ...selectedLayout.widgets.map((widget, index) => createElement(DashboardWidget, { key: `${widget.title}-${index}`, ...widget })),
  )
}
