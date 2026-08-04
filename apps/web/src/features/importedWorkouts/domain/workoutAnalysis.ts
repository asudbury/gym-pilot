import type { ImportedWorkout } from '@gym-pilot/shared'

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

export type TimelineChartPoint = {
  label: string
  count: number
}

export type ImportedWorkoutAnalysisViewModel = {
  filteredWorkouts: ImportedWorkout[]
  currentDateRangeString: string
  totalWorkouts: number
  totalDuration: number
  totalEnergy: number
  avgWorkoutsPerWeek: string | number
  avgEnergyPerWeek: string | number
  avgDuration: string | number
  chartGranularity: 'weekly' | 'daily'
  weeklyChartData: TimelineChartPoint[]
  dailyChartData: TimelineChartPoint[]
  nameChartData: Array<{ name: string; count: number }>
}
export function buildImportedWorkoutAnalysisCsv(
  workoutAnalysis: ImportedWorkoutAnalysisViewModel,
): string {
  const rows = [
    ['Metric', 'Value'],
    ['Date range', workoutAnalysis.currentDateRangeString],
    ['Total workouts', String(workoutAnalysis.totalWorkouts)],
    [
      'Total duration (minutes)',
      String(Math.round(workoutAnalysis.totalDuration / 60)),
    ],
    ['Total energy (kcal)', String(Math.round(workoutAnalysis.totalEnergy))],
    ['Avg workouts / week', String(workoutAnalysis.avgWorkoutsPerWeek)],
    ['Avg energy / week (kcal)', String(workoutAnalysis.avgEnergyPerWeek)],
    ['Avg duration (minutes)', String(workoutAnalysis.avgDuration)],
    [],
    ['Workout name', 'Count'],
    ...workoutAnalysis.nameChartData.map(({ name, count }) => [
      name,
      String(count),
    ]),
  ]

  return rows.map((row) => row.join(',')).join('\n')
}

export function buildImportedWorkoutAnalysisViewModel({
  workouts,
  filter,
  customRange,
  referenceDate = new Date(),
}: {
  workouts: ImportedWorkout[]
  filter: FilterType
  customRange?: DateRange | null
  referenceDate?: Date
}): ImportedWorkoutAnalysisViewModel {
  const filteredWorkouts = getFilteredWorkouts({
    workouts,
    filter,
    customRange,
    referenceDate,
  })
  const currentDateRangeString = getCurrentDateRangeString({
    workouts,
    filter,
    customRange,
    referenceDate,
  })

  const totalWorkouts = filteredWorkouts.length
  const totalDuration = filteredWorkouts.reduce(
    (sum, workout) => sum + workout.duration,
    0,
  )
  const totalEnergy = filteredWorkouts.reduce(
    (sum, workout) => sum + workout.energy,
    0,
  )

  const workoutsByWeek = filteredWorkouts.reduce(
    (acc, workout) => {
      const date = new Date(workout.start_date)
      const year = date.getFullYear()
      const week = Math.ceil(
        ((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7,
      )
      const weekKey = `${year}-W${week.toString().padStart(2, '0')}`
      if (!acc[weekKey]) {
        acc[weekKey] = { count: 0, energy: 0 }
      }
      acc[weekKey].count += 1
      acc[weekKey].energy += workout.energy
      return acc
    },
    {} as Record<string, { count: number; energy: number }>,
  )

  const avgWorkoutsPerWeek =
    Object.keys(workoutsByWeek).length > 0
      ? (totalWorkouts / Object.keys(workoutsByWeek).length).toFixed(0)
      : 0

  const totalEnergyFromWorkoutsByWeek = Object.values(workoutsByWeek).reduce(
    (sum, weekData) => sum + weekData.energy,
    0,
  )

  const avgEnergyPerWeek =
    Object.keys(workoutsByWeek).length > 0
      ? (
          totalEnergyFromWorkoutsByWeek / Object.keys(workoutsByWeek).length
        ).toFixed(0)
      : 0

  const avgDuration =
    totalWorkouts > 0 ? (totalDuration / totalWorkouts / 60).toFixed(0) : 0

  const weeklyChartData = Object.entries(workoutsByWeek)
    .map(([week, data]) => ({ label: week, count: data.count }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const workoutsByDay = filteredWorkouts.reduce(
    (acc, workout) => {
      const date = new Date(workout.start_date)
      const dayKey = date.toISOString().slice(0, 10)
      if (!acc[dayKey]) {
        acc[dayKey] = 0
      }
      acc[dayKey] += 1
      return acc
    },
    {} as Record<string, number>,
  )

  const dailyChartData = Object.entries(workoutsByDay)
    .map(([date, count]) => ({ label: date, count }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const chartGranularity = dailyChartData.length <= 7 ? 'daily' : 'weekly'

  const workoutsByName = filteredWorkouts.reduce(
    (acc, workout) => {
      const name = workout.display_name
      acc[name] = (acc[name] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const nameChartData = Object.entries(workoutsByName)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  return {
    filteredWorkouts,
    currentDateRangeString,
    totalWorkouts,
    totalDuration,
    totalEnergy,
    avgWorkoutsPerWeek,
    avgEnergyPerWeek,
    avgDuration,
    chartGranularity,
    weeklyChartData,
    dailyChartData,
    nameChartData,
  }
}

function getFilteredWorkouts({
  workouts,
  filter,
  customRange,
  referenceDate,
}: {
  workouts: ImportedWorkout[]
  filter: FilterType
  customRange?: DateRange | null
  referenceDate: Date
}): ImportedWorkout[] {
  const now = new Date(referenceDate)
  const startOfWeek = new Date(
    now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)),
  )
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const endOfYear = new Date(now.getFullYear(), 11, 31)

  switch (filter) {
    case 'last7days': {
      const end = new Date(now)
      const start = new Date(now)
      start.setDate(end.getDate() - 7)
      return workouts.filter((workout) => {
        const date = new Date(workout.start_date)
        return date >= start && date <= end
      })
    }
    case 'last31days': {
      const end = new Date(now)
      const start = new Date(now)
      start.setDate(end.getDate() - 31)
      return workouts.filter((workout) => {
        const date = new Date(workout.start_date)
        return date >= start && date <= end
      })
    }
    case 'last3months': {
      const end = new Date(now)
      const start = new Date(now)
      start.setMonth(end.getMonth() - 3)
      return workouts.filter((workout) => {
        const date = new Date(workout.start_date)
        return date >= start && date <= end
      })
    }
    case 'thisWeek':
      return workouts.filter((workout) => {
        const date = new Date(workout.start_date)
        return date >= startOfWeek && date <= endOfWeek
      })
    case 'thisMonth':
      return workouts.filter((workout) => {
        const date = new Date(workout.start_date)
        return date >= startOfMonth && date <= endOfMonth
      })
    case 'thisYear':
      return workouts.filter((workout) => {
        const date = new Date(workout.start_date)
        return date >= startOfYear && date <= endOfYear
      })
    case 'custom':
      if (customRange) {
        const [start, end] = customRange
        return workouts.filter((workout) => {
          const date = new Date(workout.start_date)
          return date >= start && date <= end
        })
      }
      return workouts
    case 'all':
    default:
      return workouts
  }
}

function getCurrentDateRangeString({
  workouts,
  filter,
  customRange,
  referenceDate,
}: {
  workouts: ImportedWorkout[]
  filter: FilterType
  customRange?: DateRange | null
  referenceDate: Date
}): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  const now = new Date(referenceDate)
  const startOfWeek = new Date(
    now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)),
  )
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const endOfYear = new Date(now.getFullYear(), 11, 31)

  switch (filter) {
    case 'last7days': {
      const end = new Date(now)
      const start = new Date(now)
      start.setDate(end.getDate() - 7)
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
    }
    case 'last31days': {
      const end = new Date(now)
      const start = new Date(now)
      start.setDate(end.getDate() - 31)
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
    }
    case 'last3months': {
      const end = new Date(now)
      const start = new Date(now)
      start.setMonth(end.getMonth() - 3)
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
    }
    case 'thisWeek':
      return `${startOfWeek.toLocaleDateString('en-US', options)} - ${endOfWeek.toLocaleDateString('en-US', options)}`
    case 'thisMonth':
      return `${startOfMonth.toLocaleDateString('en-US', options)} - ${endOfMonth.toLocaleDateString('en-US', options)}`
    case 'thisYear':
      return `${startOfYear.toLocaleDateString('en-US', options)} - ${endOfYear.toLocaleDateString('en-US', options)}`
    case 'custom':
      if (customRange) {
        const [start, end] = customRange
        return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`
      }
      return 'Select Custom Range'
    case 'all':
    default:
      if (workouts.length === 0) {
        return 'All Time'
      }
      const allDates = workouts.map((workout) => new Date(workout.start_date))
      const minDate = new Date(
        Math.min(...allDates.map((date) => date.getTime())),
      )
      const maxDate = new Date(
        Math.max(...allDates.map((date) => date.getTime())),
      )
      return `${minDate.toLocaleDateString('en-US', options)} - ${maxDate.toLocaleDateString('en-US', options)}`
  }
}
