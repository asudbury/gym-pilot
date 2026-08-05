import { useEffect, useMemo, useState } from 'react';
import { AnalysisHeader } from '../components/imported-workout-analysis/AnalysisHeader';
import { CustomDateRangePicker } from '../components/imported-workout-analysis/CustomDateRangePicker';
import { SummaryStatistics } from '../components/imported-workout-analysis/SummaryStatistics';
import { WorkoutsByNameChart } from '../components/imported-workout-analysis/WorkoutsByNameChart';
import { WorkoutsOverTimeChart } from '../components/imported-workout-analysis/WorkoutsOverTimeChart';
import { PageCard } from '../components/PageCard';
import { Button } from '../components/ui/Button';
import {
    buildImportedWorkoutAnalysisCsv,
    buildImportedWorkoutAnalysisViewModel,
} from '../features/importedWorkouts/domain/workoutAnalysis';
import { useImportedWorkouts } from '../hooks/useImportedWorkouts';
import { PageLayout } from '../layouts/PageLayout';
import './imported-workout-analysis.css';

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
        <AnalysisHeader filter={filter} onFilterChange={setFilter} />

        {filter === 'custom' && (
          <CustomDateRangePicker
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        )}

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
            <SummaryStatistics
              totalWorkouts={totalWorkouts}
              totalDuration={totalDuration}
              totalEnergy={totalEnergy}
              avgWorkoutsPerWeek={Number(avgWorkoutsPerWeek)}
              avgEnergyPerWeek={Number(avgEnergyPerWeek)}
              avgDuration={Number(avgDuration)}
            />

            <WorkoutsOverTimeChart
              dailyChartData={dailyChartData}
              weeklyChartData={weeklyChartData}
              chartGranularity={chartGranularity}
              onChartGranularityChange={setChartGranularity}
              filter={filter}
            />

            <WorkoutsByNameChart nameChartData={nameChartData} />
          </>
        )}
      </PageCard>
    </PageLayout>
  )
}
