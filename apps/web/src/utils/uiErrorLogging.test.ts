import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logger } from '@gym-pilot/shared'
import { reportUiError } from './uiErrorLogging'

describe('reportUiError', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('logs UI errors with context and details', () => {
    const spy = vi.spyOn(logger, 'error').mockImplementation(() => {})

    reportUiError('Timetable load failed', new Error('Bad request'), {
      clubId: '76',
    })

    expect(spy).toHaveBeenCalledWith(
      '[UI] Timetable load failed',
      expect.objectContaining({
        errorMessage: 'Bad request',
        clubId: '76',
      }),
    )
  })
})
