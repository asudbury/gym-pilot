/**
 * @file Service for handling sign-in via an Edge Function.
 * This abstracts the direct interaction with the Supabase Edge Function
 * for authentication, keeping the login orchestration logic cleaner.
 */

import { getSupabaseClient, logger } from '@gym-pilot/shared'
import type { Session, User } from '@supabase/supabase-js'

interface SignInResponse {
  data?: {
    user: User
    session: Session
  }
  error: { message: string } | null
}

/**
 * Attempts to sign in a user using a Supabase Edge Function.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<SignInResponse>} A promise that resolves with user/session data or an error.
 */
export async function handleEdgeFunctionSignIn(
  email: string,
  password: string,
): Promise<SignInResponse> {
  logger.log('[AuthService] Attempting Edge Function sign-in...')
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL // Assuming SUPABASE_URL is available from env

  if (!SUPABASE_URL) {
    logger.error(
      'VITE_SUPABASE_URL is not defined in environment variables for Edge Function login.',
    )
    return { error: { message: 'Supabase URL is not configured.' } }
  }

  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/login`

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      logger.error(
        '[AuthService] Edge Function returned error:',
        data.error || 'Unknown error',
      )
      throw new Error(data.error || 'Edge Function login failed')
    }

    if (data.session && data.user) {
      const client = getSupabaseClient()
      if (client) {
        // Manually set the session after successful Edge Function login
        await client.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        window.dispatchEvent(new CustomEvent('gym-pilot-auth-updated')) // Notify AuthProvider
      } else {
        logger.error(
          'Supabase client is not available after Edge Function login to set session.',
        )
        return {
          error: { message: 'Supabase client not available to set session.' },
        }
      }
    } else {
      logger.error('Edge Function did not return session or user data:', data)
      return { error: { message: 'Invalid response from Edge Function.' } }
    }

    logger.log(
      '[AuthService] Edge Function sign-in successful, response:',
      data,
    )
    return { data: { user: data.user, session: data.session }, error: null }
  } catch (err: unknown) {
    let message = 'An unknown error occurred.'
    if (err instanceof Error) {
      message = err.message
    }
    logger.error('[AuthService] Edge Function sign-in failed:', message)
    return { error: { message } }
  }
}
