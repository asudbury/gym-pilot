import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '../ui/Button'

type FilterType =
  | 'thisWeek'
  | 'thisMonth'
  | 'thisYear'
  | 'all'
  | 'custom'
  | 'last7days'
  | 'last31days'
  | 'last3months'

interface ChartData {
  label: string
  count: number
}

interface WorkoutsOverTimeChartProps {
  dailyChartData: ChartData[]
  weeklyChartData: ChartData[]
  chartGranularity: 'daily' | 'weekly'
  onChartGranularityChange: (granularity: 'daily' | 'weekly') => void
  filter: FilterType
}

export function WorkoutsOverTimeChart({
  dailyChartData,
  weeklyChartData,
  chartGranularity,
  onChartGranularityChange,
  filter,
}: WorkoutsOverTimeChartProps) {
  const formatXAxisLabel = (value: string, filter: FilterType) => {
    if (filter === 'all') {
      return value
    }

    if (value.includes('-W')) {
      return value.replace(/^\d{4}-W/, 'W')
    }

    const date = new Date(`${value}T00:00:00`)

    switch (filter) {
      case 'last7days':
      case 'thisWeek':
        return date.toLocaleDateString('en-GB', {
          weekday: 'short',
        })

      case 'last31days':
      case 'thisMonth':
        return date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        })

      case 'thisYear':
        return date.toLocaleDateString('en-GB', {
          month: 'short',
        })

      default:
        return date.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        })
    }
  }
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Workouts over Time</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => onChartGranularityChange('daily')}
            tone={chartGranularity === 'daily' ? 'blue' : 'default'}
          >
            Daily
          </Button>
          <Button
            onClick={() => onChartGranularityChange('weekly')}
            tone={chartGranularity === 'weekly' ? 'blue' : 'default'}
          >
            Weekly
          </Button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartGranularity === 'daily' ? dailyChartData : weeklyChartData}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickFormatter={(value) => formatXAxisLabel(value, filter)}
            interval="preserveStartEnd"
          />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#8884d8"
            name="Workouts"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
