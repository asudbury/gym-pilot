import {
  invalidateSupabaseProfileCache,
  loadAppSetting,
  loadSupabaseProfileAccessState,
  loadSupabaseProfileFlag,
  loadSupabaseProfileTermsAcceptance,
  signOutFromSupabase,
} from '@gym-pilot/shared'
import { type NavigateFunction } from 'react-router-dom'
import { persistRememberedEmail } from './loginPreferences'
import { recordWelcomeJourneyActivity } from './welcomeJourneyLogging'

export interface PostSignInOptions {
  user: any // Supabase User object
  email: string
  from: string
  navigate: NavigateFunction
  setAuthMessage: React.Dispatch<React.SetStateAction<string>>
  setAuthMessageTone: React.Dispatch<React.SetStateAction<'default' | 'error'>>
}

export const handlePostSignInLogic = async ({
  user,
  email,
  from,
  navigate,
  setAuthMessage,
  setAuthMessageTone,
}: PostSignInOptions) => {
  if (user?.id) {
    await invalidateSupabaseProfileCache(user.id)
  }

  persistRememberedEmail(email, true)

  const postLoginMessage = String(
    await loadAppSetting('post_login_message', ''),
  )

  if (postLoginMessage) {
    setAuthMessageTone('default')
    setAuthMessage(postLoginMessage)
  }

  const accessState = await loadSupabaseProfileAccessState()

  if (accessState.isBlocked) {
    void recordWelcomeJourneyActivity(
      'welcome_journey_error',
      {
        step: 'login',
        outcome: 'access_blocked',
        returnTo: from,
      },
      user?.id ?? null,
      user?.email ?? null,
    )

    await signOutFromSupabase()

    setAuthMessageTone('error')
    setAuthMessage('This account is frozen or its access has expired.')
    return
  }

  const requiresPasswordChange = await loadSupabaseProfileFlag(
    'must_change_password',
  )

  if (requiresPasswordChange) {
    void recordWelcomeJourneyActivity(
      'welcome_journey_redirected',
      {
        step: 'login',
        outcome: 'password_reset_required',
        returnTo: from,
        reason: 'must_change_password',
      },
      user?.id ?? null,
      user?.email ?? null,
    )

    setAuthMessageTone('default')
    setAuthMessage('Please set a new password to continue.')
    navigate('/reset-password', { replace: true, state: { from } })
    return
  }

  const hasAcceptedTerms = await loadSupabaseProfileTermsAcceptance()

  if (!hasAcceptedTerms) {
    void recordWelcomeJourneyActivity(
      'welcome_journey_redirected',
      {
        step: 'login',
        outcome: 'terms_required',
        returnTo: from,
        reason: 'terms_not_accepted',
      },
      user?.id ?? null,
      user?.email ?? null,
    )

    navigate('/welcome', { replace: true, state: { from } })

    return
  }

  navigate(from, { replace: true })
}
