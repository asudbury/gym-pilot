
const loggerAppName = 'gym-pilot';

/**
 * Represents a single log event captured by the extension.
 */
export interface LogEntry {
  /** Unique identifier for the log entry. */
  id: string;
  /** Severity level of the log entry. */
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent';
  /** Timestamp for when the log entry was created, in milliseconds since epoch. */
  timestamp: number;
  /** Arguments supplied with the log entry. */
  args: unknown[];
}

/**
 * In-memory log store for the current session.
 */
const logs: LogEntry[] = [];

/**
 * Creates a new log entry from the provided severity, source, and arguments.
 *
 * @param level The severity level assigned to the entry.
 * @param source The extension context that produced the entry.
 * @param args The values to record with the log event.
 * @returns A fully formed log entry ready to be stored.
 */
export function createEntry(
  level: LogEntry['level'],
  args: unknown[]
): LogEntry {
  return {
    id: crypto.randomUUID(),
    level,
    timestamp: Date.now(),
    args,
  };
}

/**
 * Adds a log entry to the in-memory store.
 * The store is trimmed to the most recent 500 entries to prevent unbounded growth.
 *
 * @param entry The log entry to store.
 */
export function addLog(entry: LogEntry) {
  logs.push(entry);
  if (logs.length > 500) logs.shift(); // prevent memory leak
}

/**
 * Returns the current list of stored log entries.
 *
 * @returns The in-memory log history.
 */
export function getLogs() {
  return logs;
}

/**
 * Clears all stored log entries from memory.
 */
export function clearLogs() {
  logs.length = 0;
}


/**
 * Numeric severity values for each log level.
 * Lower values are more verbose and higher values are more severe.
 */
export const levels: Record<LogLevel, number> = {
  /** Highly detailed diagnostic output. */
  debug: 0,
  /** General informational events. */
  info: 1,
  /** Recoverable issues that should be noticed. */
  warn: 2,
  /** Failures that require attention. */
  error: 3,
  /** Lowest-severity diagnostic output. */
  trace: 0,
  /** Suppresses logging output entirely. */
  silent: 0,
};

/**
 * Supported logging levels used throughout the extension.
 */
export type LogLevel =
  | /** Highly detailed diagnostic output. */ 'trace'
  | /** Developer-focused debugging information. */ 'debug'
  | /** General informational events. */ 'info'
  | /** Recoverable issues that should be noticed. */ 'warn'
  | /** Failures that require attention. */ 'error'
  | /** Suppresses logging output entirely. */ 'silent';


/**
 * Returns the current time as a string in 24-hour format (en-GB locale).
 * @returns {string} Current time in 'HH:mm:ss' format.
 */
export function getTime(): string {
  const d = new Date();
  return d.toLocaleTimeString('en-GB', { hour12: false });
}

/**
 * Formats console output with application name, timestamp, and log level.
 * @param {string} appName - The name of the application.
 * @param {LogLevel} level - The log level (e.g., 'debug', 'info', 'warn', 'error').
 * @param {unknown[]} args - Variable arguments to be logged.
 * @returns {unknown[]} Formatted arguments for console output.
 */
export function formatConsolePretty(
  appName: string,
  level: LogLevel,
  args: unknown[]
): unknown[] {
  return [
    `[${appName}]`,
    `[${getTime()}]`,
    `[${level.toUpperCase()}]`,
    ...args,
  ];
}


/**
 * Contract for the extension logging facade.
 *
 * Implementations can be shared across background, content, popup, and devtools contexts.
 */
export interface ILoggingService {
  /**
   * Logs a debug message.
   *
   * @param args Message parts to record.
   */
  debug: (...args: unknown[]) => void;

  /**
   * Logs an informational message.
   *
   * @param args Message parts to record.
   */
  info: (...args: unknown[]) => void;

  /**
   * Logs a warning message.
   *
   * @param args Message parts to record.
   */
  warn: (...args: unknown[]) => void;

  /**
   * Logs an error message.
   *
   * @param args Message parts to record.
   */
  error: (...args: unknown[]) => void;

  /**
   * Logs a generic message.
   *
   * @param args Message parts to record.
   */
  log: (...args: unknown[]) => void;
}

// export let currentLogLevel: LogLevel =
//   import.meta.env.MODE === 'production' ? 'debug' : 'debug';

export const currentLogLevel: LogLevel = 'debug';

let singletonLogger: ILoggingService | null = null;

export function getLogger(): ILoggingService {
  if (!singletonLogger) {
    singletonLogger = new LoggingService();
  }

  return singletonLogger;
}

// async function getFromStorage<T>(key: string): Promise<T | undefined> {
//   const result = await chrome.storage.local.get(key);
//   return result as T;
// }

/**
 * Creates a logger instance and loads the configured log level from storage.
 *
 * The logger is shared across extension contexts and is initialised lazily on first use.
 *
 * @returns A promise resolving to the shared logger implementation.
 */
export async function createLogger(): Promise<ILoggingService> {
  // const logLevel = await getFromStorage<LogLevel>('logLevel');

  // currentLogLevel =
  //   logLevel ?? (import.meta.env.MODE === 'production' ? 'debug' : 'debug');

  console.log(
    `createLogger: currentLogLevel = ${JSON.stringify(currentLogLevel)}`
  );

  return getLogger();
}

const enabled = (level: LogLevel) => levels[level] >= levels[currentLogLevel];

/**
 * Shared logging implementation used across the extension.
 *
 * The implementation writes to the in-memory log store, emits browser console output,
 * and respects the current log level threshold.
 */
export class LoggingService implements ILoggingService {
  debug: (...args: unknown[]) => void = (...args) => {
    if (enabled('debug')) {
      const entry = createEntry('debug', args);
      addLog(entry);
      console.debug(...formatConsolePretty(loggerAppName, 'debug', args));
    }
  };

  info: (...args: unknown[]) => void = (...args) => {
    if (enabled('info')) {
      const entry = createEntry('info', args);
      addLog(entry);
      console.info(...formatConsolePretty(loggerAppName, 'info', args));
    }
  };

  warn: (...args: unknown[]) => void = (...args) => {
    if (enabled('warn')) {
      const entry = createEntry('warn', args);
      addLog(entry);
      console.warn(...formatConsolePretty(loggerAppName, 'warn', args));
    }
  };

  error: (...args: unknown[]) => void = (...args) => {
    if (enabled('error')) {
      const entry = createEntry('error', args);
      addLog(entry);
      console.error(...formatConsolePretty(loggerAppName, 'error', args));
    }
  };

  log: (...args: unknown[]) => void = (...args) => {
    if (enabled('info')) {
      const entry = createEntry('info', args);
      addLog(entry);
      console.log(...formatConsolePretty(loggerAppName, 'info', args));
    }
  };
}

export const logger: ILoggingService = getLogger();

/**
 * No-op logger used when logging is disabled or unavailable.
 *
 * This is useful for initial startup paths or environments where logging should be silent.
 */
export class NoLoggingService implements ILoggingService {
  debug: () => void = () => {
    /* empty */
  };
  info: () => void = () => {
    /* empty */
  };
  warn: () => void = () => {
    /* empty */
  };
  error: () => void = () => {
    /* empty */
  };
  log: () => void = () => {
    /* empty */
  };
}
