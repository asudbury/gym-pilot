import { describe, expect, it } from 'vitest'
import { resolveTimetableViewModel } from './timetableView'

describe('resolveTimetableViewModel', () => {
  it('groups sessions by day and filters by instructor and class', () => {
    const viewModel = resolveTimetableViewModel({
      sessions: [
        {
          id: 1,
          className: 'Yoga',
          instructorName: 'Ada',
          startTime: '2025-01-02T09:00:00.000Z',
          endTime: '2025-01-02T10:00:00.000Z',
        },
        {
          id: 2,
          className: 'Strength',
          instructorName: 'Ben',
          startTime: '2025-01-03T09:00:00.000Z',
          endTime: '2025-01-03T10:00:00.000Z',
        },
      ],
      activeDayKey: 'all',
      activeInstructor: 'Ada',
      activeClassName: 'all',
    })

    expect(viewModel.groupedSessions).toHaveLength(2)
    expect(viewModel.visibleSessions).toHaveLength(1)
    expect(viewModel.visibleSessions[0]?.className).toBe('Yoga')
    expect(viewModel.instructorOptions).toEqual(['Ada', 'Ben'])
  })
})
