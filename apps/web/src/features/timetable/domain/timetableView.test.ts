import { describe, expect, it } from 'vitest'
import {
  resolveNextActiveDayKey,
  resolveTimetableAttendanceAction,
  resolveTimetableHeaderViewModel,
  resolveTimetableViewModel,
} from './timetableView'

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

  it('hides the header icon when the gym details are not set', () => {
    const viewModel = resolveTimetableHeaderViewModel({
      gymBrand: '',
      gymName: '',
      resolvedClubName: null,
    })

    expect(viewModel.showIcon).toBe(false)
    expect(viewModel.title).toBe('Timetable')
    expect(viewModel.subtitle).toBe('Gym not selected')
  })

  it('does not render timetable content without a club id', () => {
    const viewModel = resolveTimetableViewModel({
      sessions: [],
      activeDayKey: 'all',
      activeInstructor: 'all',
      activeClassName: 'all',
    })

    expect(viewModel.groupedSessions).toEqual([])
    expect(viewModel.visibleSessions).toEqual([])
  })

  it('keeps all-days selected when the day groups update', () => {
    expect(resolveNextActiveDayKey('all', [{ dateKey: '2025-01-02' }])).toBe(
      'all',
    )
  })

  it('only exposes instructors from sessions that have a class', () => {
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
          className: null,
          instructorName: 'Ben',
          startTime: '2025-01-03T09:00:00.000Z',
          endTime: '2025-01-03T10:00:00.000Z',
        },
      ],
      activeDayKey: 'all',
      activeInstructor: 'all',
      activeClassName: 'all',
    })

    expect(viewModel.instructorOptions).toEqual(['Ada'])
  })

  it('returns the right attendance action for clients and trainers', () => {
    expect(resolveTimetableAttendanceAction('client', [])).toMatchObject({
      canShow: true,
      kind: 'attended',
      label: 'I attended',
      completedLabel: 'Marked as attended',
    })

    expect(resolveTimetableAttendanceAction('trainer', [])).toMatchObject({
      canShow: true,
      kind: 'taught',
      label: 'I attended',
      completedLabel: 'Marked as attended',
    })
  })

  it('offers both attendance options when the user has both roles', () => {
    const action = resolveTimetableAttendanceAction('client', ['trainer'])

    expect(action.canShow).toBe(true)
    expect(action.kind).toBeNull()
    expect(action.options).toEqual([
      { kind: 'attended', label: 'I attended' },
      { kind: 'taught', label: 'I taught' },
    ])
  })
})
