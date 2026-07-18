const loggerAppName = 'gym-pilot'

export interface LogEntry {
  id: string
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'
  timestamp: number
  args: unknown[]
}

const logs: LogEntry[] = []

export function createEntry(level: LogEntry['level'], args: unknown[]): LogEntry {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    level,
    timestamp: Date.now(),
    args,
  }
}

export function addLog(entry: LogEntry) {
  logs.push(entry)
  if (logs.length > 500) {
    logs.shift()
  }
}

export function getLogs() {
  return logs
}

export function clearLogs() {
  logs.length = 0
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'

export const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  trace: 0,
  silent: 0,
}

export function getTime(): string {
  const d = new Date()
  return d.toLocaleTimeString('en-GB', { hour12: false })
}

export function formatConsolePretty(appName: string, level: LogLevel, args: unknown[]): unknown[] {
  return [`[${appName}]`, `[${getTime()}]`, `[${level.toUpperCase()}]`, ...args]
}

export interface ILoggingService {
  debug: (...args: unknown[]) => void
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  log: (...args: unknown[]) => void
}

export const currentLogLevel: LogLevel = 'debug'

let singletonLogger: ILoggingService | null = null

export function getLogger(): ILoggingService {
  if (!singletonLogger) {
    singletonLogger = new LoggingService()
  }

  return singletonLogger
}

export async function createLogger(): Promise<ILoggingService> {
  return getLogger()
}

const enabled = (level: LogLevel) => levels[level] >= levels[currentLogLevel]

export class LoggingService implements ILoggingService {
  debug: (...args: unknown[]) => void = (...args) => {
    if (enabled('debug')) {
      const entry = createEntry('debug', args)
      addLog(entry)
      console.debug(...formatConsolePretty(loggerAppName, 'debug', args))
    }
  }

  info: (...args: unknown[]) => void = (...args) => {
    if (enabled('info')) {
      const entry = createEntry('info', args)
      addLog(entry)
      console.info(...formatConsolePretty(loggerAppName, 'info', args))
    }
  }

  warn: (...args: unknown[]) => void = (...args) => {
    if (enabled('warn')) {
      const entry = createEntry('warn', args)
      addLog(entry)
      console.warn(...formatConsolePretty(loggerAppName, 'warn', args))
    }
  }

  error: (...args: unknown[]) => void = (...args) => {
    if (enabled('error')) {
      const entry = createEntry('error', args)
      addLog(entry)
      console.error(...formatConsolePretty(loggerAppName, 'error', args))
    }
  }

  log: (...args: unknown[]) => void = (...args) => {
    if (enabled('info')) {
      const entry = createEntry('info', args)
      addLog(entry)
      console.log(...formatConsolePretty(loggerAppName, 'info', args))
    }
  }
}

export const logger: ILoggingService = getLogger()

export class NoLoggingService implements ILoggingService {
  debug: () => void = () => {
    /* empty */
  }
  info: () => void = () => {
    /* empty */
  }
  warn: () => void = () => {
    /* empty */
  }
  error: () => void = () => {
    /* empty */
  }
  log: () => void = () => {
    /* empty */
  }
}
