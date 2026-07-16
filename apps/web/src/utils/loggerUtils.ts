export type LogLevel =
  | 'debug'
  | 'info'
  | 'warn'
  | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;

  category?: string;

  data?: unknown;

  stack?: string;

  route?: string;

  sessionId: string;

  version: string;
}

type Listener = (entry: LogEntry) => void;

class Logger {
  private listeners: Listener[] = [];

  private sessionId = crypto.randomUUID();

  addListener(listener: Listener) {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter((x) => x !== listener);
    };
  }

  debug(message: string, data?: unknown) {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown) {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown) {
    this.log('warn', message, data);
  }

  error(message: string, error?: unknown) {
    this.log('error', message, error);
  }

  private async log(
    level: LogLevel,
    message: string,
    data?: unknown,
  ) {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),

      level,
      message,
      data,

      stack:
        data instanceof Error
          ? data.stack
          : undefined,

      route: window.location.pathname,

      sessionId: this.sessionId,

      version: import.meta.env.VITE_APP_VERSION ?? 'dev',
    };

    this.writeConsole(entry);

    await this.save(entry);

    this.listeners.forEach((l) => l(entry));

    this.upload(entry);
  }

  private writeConsole(entry: LogEntry) {
    console[entry.level === 'debug' ? 'log' : entry.level](entry);
  }

  private async save(_entry: LogEntry) {
    // Save to IndexedDB
  }

  private async upload(_entry: LogEntry) {
    // Queue for upload
  }
}

export const logger = new Logger();

