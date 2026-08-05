import { Button } from '../ui/Button'
import { ResponsiveVisibility } from '../visibility/ResponsiveVisibility'

type FilterType =
  | 'thisWeek'
  | 'thisMonth'
  | 'thisYear'
  | 'all'
  | 'custom'
  | 'last7days'
  | 'last31days'
  | 'last3months'

interface AnalysisHeaderProps {
  filter: FilterType
  onFilterChange: (filter: FilterType) => void
}

export function AnalysisHeader({
  filter,
  onFilterChange,
}: AnalysisHeaderProps) {
  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'last7days', label: 'Last 7 days' },
    { id: 'last31days', label: 'Last 31 days' },
    { id: 'last3months', label: 'Last 3 months' },
    { id: 'thisWeek', label: 'This Week' },
    { id: 'thisMonth', label: 'This Month' },
    { id: 'thisYear', label: 'This Year' },
    { id: 'custom', label: 'Custom Range' },
  ]

  return (
    <>
      <h1 className="text-2xl font-bold">Fitness Analysis</h1>

      <div>
        <ResponsiveVisibility hiddenOn="mobile">
          <div className="flex flex-wrap gap-2">
            {filters.map(({ id, label }) => (
              <Button
                key={id}
                onClick={() => onFilterChange(id)}
                tone={filter === id ? 'blue' : 'default'}
              >
                {label}
              </Button>
            ))}
          </div>
        </ResponsiveVisibility>
        <ResponsiveVisibility visibleOn="mobile">
          <select
            className="w-full p-2 border rounded"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as FilterType)}
          >
            {filters.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </ResponsiveVisibility>
      </div>
    </>
  )
}
