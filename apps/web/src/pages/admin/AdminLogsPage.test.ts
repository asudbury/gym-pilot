import { describe, expect, it } from 'vitest'
import { resolveLogTableName } from './AdminLogsPage'

describe('resolveLogTableName', () => {
  it('maps the error view to the error log table and the audit view to the audit log table', () => {
    expect(resolveLogTableName('error')).toBe('gym_pilot_error_log')
    expect(resolveLogTableName('audit')).toBe('gym_pilot_audit_log')
    expect(resolveLogTableName('combined')).toBeNull()
  })
})
