import { describe, expect, it } from 'vitest'
import { filterLogEntriesByText, resolveLogTableName } from './AdminLogsPage'

describe('resolveLogTableName', () => {
  it('maps the error view to the error log table and the audit view to the audit log table', () => {
    expect(resolveLogTableName('error')).toBe('gym_pilot_error_log')
    expect(resolveLogTableName('audit')).toBe('gym_pilot_audit_log')
    expect(resolveLogTableName('combined')).toBeNull()
  })
})

describe('filterLogEntriesByText', () => {
  it('filters log entries by name or text content', () => {
    const entries = [
      { id: '1', message: 'User login', details: { friendly_name: 'Ada' } },
      {
        id: '2',
        message: 'Password reset',
        details: { friendly_name: 'Grace' },
      },
    ]

    expect(
      filterLogEntriesByText(entries as Array<Record<string, unknown>>, 'ada'),
    ).toHaveLength(1)
    expect(
      filterLogEntriesByText(
        entries as Array<Record<string, unknown>>,
        'grace',
      ),
    ).toHaveLength(1)
    expect(
      filterLogEntriesByText(
        entries as Array<Record<string, unknown>>,
        'missing',
      ),
    ).toHaveLength(0)
  })
})
