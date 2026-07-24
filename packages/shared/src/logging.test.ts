import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addLog,
  clearLogs,
  createEntry,
  formatConsolePretty,
  getLogs,
  logger,
  shouldPersistAuditLogs,
  shouldPersistErrorLogs,
} from './logging'

describe('logging helpers', () => {
  beforeEach(() => {
    clearLogs()
    vi.restoreAllMocks()
  })

  it('creates log entries with the expected shape', () => {
    const entry = createEntry('info', ['hello'])

    expect(entry.level).toBe('info')
    expect(entry.args).toEqual(['hello'])
    expect(entry.id).toBeTruthy()
    expect(entry.timestamp).toBeGreaterThan(0)
  })

  it('stores and clears log entries', () => {
    addLog(createEntry('warn', ['warn message']))

    expect(getLogs()).toHaveLength(1)

    clearLogs()

    expect(getLogs()).toHaveLength(0)
  })

  it('formats console output with the app name and level', () => {
    const formatted = formatConsolePretty('demo-app', 'debug', ['message'])

    expect(formatted[0]).toBe('[demo-app]')
    expect(formatted[2]).toBe('[DEBUG]')
    expect(formatted[3]).toBe('message')
  })

  it('writes to the console when logging via the shared logger', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

    logger.info('hello from logger')

    expect(consoleSpy).toHaveBeenCalled()
    expect(getLogs().length).toBeGreaterThan(0)
  })

  it('respects app settings for error and audit persistence', () => {
    expect(shouldPersistErrorLogs({ error_logging_enabled: true })).toBe(true)
    expect(shouldPersistErrorLogs({ error_logging_enabled: false })).toBe(false)
    expect(shouldPersistAuditLogs({ audit_logging_enabled: true })).toBe(true)
    expect(shouldPersistAuditLogs({ audit_logging_enabled: false })).toBe(false)
  })
})
