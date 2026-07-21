import { describe, expect, it } from 'vitest'
import { buildWelcomeJourneyActivity } from './welcomeJourneyLogging'

describe('buildWelcomeJourneyActivity', () => {
  it('creates a safe payload for welcome-journey events', () => {
    const activity = buildWelcomeJourneyActivity('welcome_journey_redirected', {
      step: 'welcome',
      outcome: 'password_reset_required',
      returnTo: '/dashboard',
      reason: 'must_change_password',
    })

    expect(activity.eventType).toBe('welcome_journey_redirected')
    expect(activity.eventData).toEqual(
      expect.objectContaining({
        step: 'welcome',
        outcome: 'password_reset_required',
        returnTo: '/dashboard',
        reason: 'must_change_password',
        deviceType: expect.any(String),
        isMobile: expect.any(Boolean),
      }),
    )
  })

  it('drops sensitive keys from the payload', () => {
    const activity = buildWelcomeJourneyActivity('welcome_journey_completed', {
      step: 'terms',
      outcome: 'accepted',
      email: 'person@example.com',
      password: 'secret',
      token: 'abc',
    })

    expect(activity.eventData).toEqual(
      expect.objectContaining({
        step: 'terms',
        outcome: 'accepted',
        deviceType: expect.any(String),
        isMobile: expect.any(Boolean),
      }),
    )
  })
})
