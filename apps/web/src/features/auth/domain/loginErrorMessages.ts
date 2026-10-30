export type LoginFailureReason =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'too_many_requests'
  | 'session_expired'
  | 'unknown'

function getErrorText(input: unknown): string {
  if (input instanceof Error) {
    return input.message
  }

  if (typeof input === 'string') {
    return input
  }

  if (input && typeof input === 'object') {
    const candidate =
      'message' in input && typeof input.message === 'string'
        ? input.message
        : 'error' in input && input.error && typeof input.error === 'string'
          ? input.error
          : ''

    if (candidate.trim()) {
      return candidate
    }
  }

  return ''
}

export function resolveLoginFailureReason(input: unknown): LoginFailureReason {
  const message = getErrorText(input).toLowerCase()

  if (
    /invalid login credentials|incorrect.*password|email or password.*incorrect|user not found|not found.*email/i.test(
      message,
    )
  ) {
    return 'invalid_credentials'
  }

  if (
    /email.*not confirmed|confirm.*email|unconfirmed email|confirmation.*required|email.*confirmation/i.test(
      message,
    )
  ) {
    return 'email_not_confirmed'
  }

  if (
    /too many requests|rate limit|rate-limited|temporarily blocked|try again later/i.test(
      message,
    )
  ) {
    return 'too_many_requests'
  }

  if (/jwt|token|session.*expired|refresh.*token|session.*invalid|expired.*session/i.test(message)) {
    return 'session_expired'
  }

  return 'unknown'
}

export function resolveLoginFailureMessage(input: unknown): string {
  const reason = resolveLoginFailureReason(input)

  switch (reason) {
    case 'invalid_credentials':
      return 'Your email or password is incorrect. Please try again or reset your password.'
    case 'email_not_confirmed':
      return 'Your email address needs to be confirmed before you can sign in. Check your inbox for the confirmation email, or request a new one.'
    case 'too_many_requests':
      return 'Too many sign-in attempts were made recently. Please wait a moment and try again.'
    case 'session_expired':
      return 'Your sign-in session has expired. Please sign in again.'
    default:
      return 'We could not sign you in. Please check your details and try again, or reset your password if needed.'
  }
}

export function resolveLoginFailureDetails(input: unknown) {
  return {
    reason: resolveLoginFailureReason(input),
    message: resolveLoginFailureMessage(input),
  }
}
