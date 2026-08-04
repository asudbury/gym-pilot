import { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { PageCard } from '../components/PageCard';
import { Button } from '../components/ui/Button';
import { ResponsiveVisibility } from '../components/visibility/ResponsiveVisibility';
import {
    buildImportedWorkoutAnalysisCsv,
    buildImportedWorkoutAnalysisViewModel,
} from '../features/importedWorkouts/domain/workoutAnalysis';
import { useImportedWorkouts } from '../hooks/useImportedWorkouts';
import { PageLayout } from '../layouts/PageLayout';

const LOCAL_STORAGE_FILTER_KEY = 'importedWorkoutAnalysisFilter'

type FilterType =
  | 'thisWeek'
  | 'thisMonth'
  | 'thisYear'
  | 'all'
  | 'custom'
  | 'last7days'
  | 'last31days'
  | 'last3months'
type DateRange = [Date, Date]

export function ImportedWorkoutAnalysisPage() {
  const { workouts, loading } = useImportedWorkouts()
  const [filter, setFilter] = useState<FilterType>(() => {
    const storedFilter = localStorage.getItem(LOCAL_STORAGE_FILTER_KEY)
    return (storedFilter as FilterType) || 'all'
  })
  const [customRange, setCustomRange] = useState<DateRange | null>(null)
  const [chartGranularity, setChartGranularity] = useState<'weekly' | 'daily'>(
    'weekly',
  )

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_FILTER_KEY, filter)
  }, [filter])

  const analysisViewModel = useMemo(
    () =>
      buildImportedWorkoutAnalysisViewModel({
        workouts,
        filter,
        customRange,
      }),
    [workouts, filter, customRange],
  )

  const {
    filteredWorkouts,
    currentDateRangeString,
    totalWorkouts,
    totalDuration,
    totalEnergy,
    avgWorkoutsPerWeek,
    avgEnergyPerWeek,
    avgDuration,
    chartGranularity: viewModelChartGranularity,
    weeklyChartData,
    dailyChartData,
    nameChartData,
  } = analysisViewModel

  useMemo(() => {
    setChartGranularity(viewModelChartGranularity)
  }, [viewModelChartGranularity])

  const handleExport = () => {
    const csv = buildImportedWorkoutAnalysisCsv(analysisViewModel)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `apple-fitness-analysis-${filter}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <PageLayout>
        <PageCard>
          <p>Loading...</p>
        </PageCard>
      </PageLayout>
    )
  }

  return (
    <PageLayout className="gap-6">
      <PageCard as="section" className="space-y-6">
        <h1 className="text-2xl font-bold">Apple Fitness Workout Analysis</h1>

        <div>
          <ResponsiveVisibility hiddenOn="mobile">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setFilter('all')}
                tone={filter === 'all' ? 'blue' : 'default'}
              >
                All
              </Button>
              <Button
                onClick={() => setFilter('last7days')}
                tone={filter === 'last7days' ? 'blue' : 'default'}
              >
                Last 7 days
              </Button>
              <Button
                onClick={() => setFilter('last31days')}
                tone={filter === 'last31days' ? 'blue' : 'default'}
              >
                Last 31 days
              </Button>
              <Button
                onClick={() => setFilter('last3months')}
                tone={filter === 'last3months' ? 'blue' : 'default'}
              >
                Last 3 months
              </Button>
              <Button
                onClick={() => setFilter('thisWeek')}
                tone={filter === 'thisWeek' ? 'blue' : 'default'}
              >
                This Week
              </Button>
              <Button
                onClick={() => setFilter('thisMonth')}
                tone={filter === 'thisMonth' ? 'blue' : 'default'}
              >
                This Month
              </Button>
              <Button
                onClick={() => setFilter('thisYear')}
                tone={filter === 'thisYear' ? 'blue' : 'default'}
              >
                This Year
              </Button>
              <Button
                onClick={() => setFilter('custom')}
                tone={filter === 'custom' ? 'blue' : 'default'}
              >
                Custom Range
              </Button>
            </div>
          </ResponsiveVisibility>
          <ResponsiveVisibility visibleOn="mobile">
            <select
              className="w-full p-2 border rounded"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
            >
              <option value="all">All</option>
              <option value="last7days">Last 7 days</option>
              <option value="last31days">Last 31 days</option>
              <option value="last3months">Last 3 months</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </ResponsiveVisibility>
        </div>

        {filter === 'custom' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
              <div className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 md:min-w-[280px] md:p-3">
                <p className="mb-2 text-sm font-semibold">From</p>
                <Calendar
                  onChange={(value) => {
                    const nextValue = value as Date | Date[] | null
                    if (Array.isArray(nextValue)) {
                      return
                    }
                    setCustomRange((currentRange) => {
                      if (currentRange == null) {
                        return nextValue == null ? null : [nextValue, nextValue]
                      }
                      return [nextValue ?? currentRange[0], currentRange[1]]
                    })
                  }}
                  value={customRange?.[0] ?? null}
                  className="react-calendar-mobile"
                />
              </div>
              <div className="w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 md:min-w-[280px] md:p-3">
                <p className="mb-2 text-sm font-semibold">To</p>
                <Calendar
                  onChange={(value) => {
                    const nextValue = value as Date | Date[] | null
                    if (Array.isArray(nextValue)) {
                      return
                    }
                    setCustomRange((currentRange) => {
                      if (currentRange == null) {
                        return nextValue == null ? null : [nextValue, nextValue]
                      }
                      return [currentRange[0], nextValue ?? currentRange[1]]
                    })
                  }}
                  value={customRange?.[1] ?? null}
                  minDate={customRange?.[0]}
                  className="react-calendar-mobile"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setCustomRange(null)} tone="default">
                Clear range
              </Button>
              {customRange?.[0] != null && customRange?.[1] != null && (
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {customRange[0].toLocaleDateString('en-US')} -{' '}
                  {customRange[1].toLocaleDateString('en-US')}
                </span>
              )}
            </div>
          </div>
        )}

        <style>{`
          .react-calendar-mobile .react-calendar__tile {
            max-width: 2.2rem;
            height: 2.2rem;
            font-size: 0.8rem;
            padding: 0;
          }

          .react-calendar-mobile .react-calendar__month-view__weekdays__weekday {
            font-size: 0.7rem;
          }

          @media (min-width: 768px) {
            .react-calendar-mobile .react-calendar__tile {
              max-width: 2.6rem;
              height: 2.6rem;
              font-size: 0.85rem;
            }
          }
        `}</style>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm pb-2">{currentDateRangeString}</span>
          <Button onClick={handleExport} tone="default">
            Export CSV
          </Button>
        </div>
        {filteredWorkouts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            No imported workouts match this time range yet. Import some Apple
            Fitness data to start analysing your activity.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                <h2 className="text-lg font-semibold">Total Workouts</h2>
                <p className="text-3xl font-bold">
                  {totalWorkouts.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                <h2 className="text-lg font-semibold">
                  Total Duration (minutes)
                </h2>
                <p className="text-3xl font-bold">
                  {Number((totalDuration / 60).toFixed(0)).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                <h2 className="text-lg font-semibold">Total Energy (kcal)</h2>
                <p className="text-3xl font-bold">
                  {Number(totalEnergy.toFixed(0)).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                <h2 className="text-lg font-semibold">Avg Workouts / Week</h2>
                <p className="text-3xl font-bold">
                  {Number(avgWorkoutsPerWeek).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                <h2 className="text-lg font-semibold">
                  Avg Energy / Week (kcal)
                </h2>
                <p className="text-3xl font-bold">
                  {Number(avgEnergyPerWeek).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                <h2 className="text-lg font-semibold">
                  Avg Duration (minutes)
                </h2>
                <p className="text-3xl font-bold">
                  {Number(avgDuration).toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">Workouts over Time</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setChartGranularity('daily')}
                    tone={chartGranularity === 'daily' ? 'blue' : 'default'}
                  >
                    Daily
                  </Button>
                  <Button
                    onClick={() => setChartGranularity('weekly')}
                    tone={chartGranularity === 'weekly' ? 'blue' : 'default'}
                  >
                    Weekly
                  </Button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={
                    chartGranularity === 'daily'
                      ? dailyChartData
                      : weeklyChartData
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
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

            <div>
              <h2 className="text-xl font-bold mb-4">Workouts by Name</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={nameChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </PageCard>
    </PageLayout>
  )
}
