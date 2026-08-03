import { logger } from '@gym-pilot/shared'

export function reportUiError(
  message: string,
  error: unknown,
  details?: Record<string, unknown>,
) {
  const normalizedError =
    error instanceof Error ? error : new Error(String(error ?? 'Unknown error'))

  logger.error(`[UI] ${message}`, {
    errorMessage: normalizedError.message,
    errorName: normalizedError.name,
    ...details,
  })
}
