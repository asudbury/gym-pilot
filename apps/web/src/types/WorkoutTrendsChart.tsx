import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { WorkoutTrend } from './healthData'

type WorkoutTrendsChartProps = {
  trends: WorkoutTrend[]
}

export const WorkoutTrendsChart: React.FC<WorkoutTrendsChartProps> = ({
  trends,
}) => {
  if (!trends || trends.length === 0) {
    return (
      <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-800">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Workout Trends
        </h3>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          No trend data available.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-slate-800">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {trends.map((trend) => (
          <div
            key={trend.id}
            className="rounded-md border bg-slate-50 p-4 dark:bg-slate-700"
          >
            <h4 className="mb-3 text-base font-medium text-slate-800 dark:text-slate-200">
              {trend.name} ({trend.unit})
            </h4>
            {trend.data.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={trend.data}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#334155',
                      borderColor: '#475569',
                      color: '#f8fafc',
                    }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Not enough data to display a chart.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
