import { describe, expect, it } from 'vitest'
import {
  resolveLoginFailureDetails,
  resolveLoginFailureMessage,
  resolveLoginFailureReason,
} from './loginErrorMessages'

describe('login error messages', () => {
  it('maps invalid credential errors to a safe message', () => {
    expect(
      resolveLoginFailureReason(new Error('Invalid login credentials')),
    ).toBe('invalid_credentials')
    expect(
      resolveLoginFailureMessage(new Error('Invalid login credentials')),
    ).toBe(
      'Your email or password is incorrect. Please try again or reset your password.',
    )
  })

  it('maps unconfirmed email errors to a safe message', () => {
    expect(resolveLoginFailureReason(new Error('Email not confirmed'))).toBe(
      'email_not_confirmed',
    )
    expect(resolveLoginFailureMessage(new Error('Email not confirmed'))).toBe(
      'Your email address needs to be confirmed before you can sign in. Check your inbox for the confirmation email, or request a new one.',
    )
  })

  it('maps rate limit errors to a safe message', () => {
    expect(resolveLoginFailureReason(new Error('Too many requests'))).toBe(
      'too_many_requests',
    )
    expect(resolveLoginFailureMessage(new Error('Too many requests'))).toBe(
      'Too many sign-in attempts were made recently. Please wait a moment and try again.',
    )
  })

  it('falls back to a generic message for unknown failures', () => {
    expect(resolveLoginFailureReason(new Error('Network down'))).toBe('unknown')
    expect(resolveLoginFailureDetails(new Error('Network down'))).toEqual({
      reason: 'unknown',
      message:
        'We could not sign you in. Please check your details and try again, or reset your password if needed.',
    })
  })
})
