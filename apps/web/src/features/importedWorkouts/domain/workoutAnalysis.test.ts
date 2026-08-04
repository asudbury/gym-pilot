import type { ImportedWorkout } from '@gym-pilot/shared'
import { describe, expect, it } from 'vitest'
import {
  buildImportedWorkoutAnalysisCsv,
  buildImportedWorkoutAnalysisViewModel,
} from './workoutAnalysis'

function createWorkout(
  overrides: Partial<ImportedWorkout> = {},
): ImportedWorkout {
  return {
    id: 'workout-1',
    user_id: 'user-1',
    original_id: null,
    display_name: 'Run',
    start_date: '2024-01-02T09:00:00.000Z',
    duration: 1800,
    energy: 300,
    energy_unit: 'kcal',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  } as ImportedWorkout
}

describe('buildImportedWorkoutAnalysisViewModel', () => {
  it('summarises all workouts when no filter is applied', () => {
    const workouts = [
      createWorkout({
        id: 'workout-1',
        display_name: 'Run',
        start_date: '2024-01-02T09:00:00.000Z',
        duration: 1800,
        energy: 300,
      }),
      createWorkout({
        id: 'workout-2',
        display_name: 'Cycle',
        start_date: '2024-01-10T09:00:00.000Z',
        duration: 2400,
        energy: 400,
      }),
    ]

    const viewModel = buildImportedWorkoutAnalysisViewModel({
      workouts,
      filter: 'all',
      referenceDate: new Date('2024-01-15T12:00:00.000Z'),
    })

    expect(viewModel.totalWorkouts).toBe(2)
    expect(viewModel.totalDuration).toBe(4200)
    expect(viewModel.totalEnergy).toBe(700)
    expect(viewModel.avgDuration).toBe('35')
    expect(viewModel.chartGranularity).toBe('daily')
    expect(viewModel.dailyChartData).toEqual([
      { label: '2024-01-02', count: 1 },
      { label: '2024-01-10', count: 1 },
    ])
    expect(viewModel.nameChartData).toEqual([
      { name: 'Run', count: 1 },
      { name: 'Cycle', count: 1 },
    ])
  })

  it('filters workouts by a custom range', () => {
    const workouts = [
      createWorkout({
        id: 'workout-1',
        start_date: '2024-01-02T09:00:00.000Z',
      }),
      createWorkout({
        id: 'workout-2',
        start_date: '2024-01-10T09:00:00.000Z',
      }),
    ]

    const viewModel = buildImportedWorkoutAnalysisViewModel({
      workouts,
      filter: 'custom',
      customRange: [
        new Date('2024-01-02T00:00:00.000Z'),
        new Date('2024-01-02T23:59:59.999Z'),
      ],
      referenceDate: new Date('2024-01-15T12:00:00.000Z'),
    })

    expect(viewModel.filteredWorkouts).toHaveLength(1)
    expect(viewModel.currentDateRangeString).toContain('Jan 2')
    expect(viewModel.totalWorkouts).toBe(1)
  })

  it('defaults to daily grouping for short ranges', () => {
    const viewModel = buildImportedWorkoutAnalysisViewModel({
      workouts: [
        createWorkout({
          start_date: '2024-01-02T09:00:00.000Z',
        }),
      ],
      filter: 'last7days',
      referenceDate: new Date('2024-01-15T12:00:00.000Z'),
    })

    expect(viewModel.chartGranularity).toBe('daily')
  })

  it('builds csv content for the current analysis view model', () => {
    const viewModel = buildImportedWorkoutAnalysisViewModel({
      workouts: [
        createWorkout({
          display_name: 'Run',
          start_date: '2024-01-02T09:00:00.000Z',
          duration: 1800,
          energy: 300,
        }),
      ],
      filter: 'all',
      referenceDate: new Date('2024-01-15T12:00:00.000Z'),
    })

    const csv = buildImportedWorkoutAnalysisCsv(viewModel)

    expect(csv).toContain('Metric,Value')
    expect(csv).toContain('Total workouts,1')
    expect(csv).toContain('Workout name,Count')
    expect(csv).toContain('Run,1')
  })
})
