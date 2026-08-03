/**
 * @file Custom hook for handling user login orchestration.
 * This hook abstracts the decision logic for different sign-in paths
 * (e.g., password-based vs. edge function-based) and manages the
 * loading and error states associated with the login process.
 *
 * It adheres to the architecture principle of moving business logic
 * into feature-domain modules and keeping UI components thin.
 */

import { logger, signInWithPassword } from '@gym-pilot/shared'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { handlePostSignInLogic } from '../domain/postSignInLogic'

/**
 * Custom React hook to manage the login process.
 *
 * @returns {object} An object containing:
 *   - `login`: An asynchronous function to initiate the login process.
 *   - `isLoading`: A boolean indicating if a login attempt is currently in progress.
 *   - `error`: A string containing the error message if login fails, otherwise `null`.
 *   - `clearError`: A function to clear any existing error messages.
 */
export const useLoginFeature = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const clearError = useCallback(() => setError(null), [])

  const login = useCallback(
    async (email: string, password: string, from = '/') => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await signInWithPassword(email, password)

        if (response.error) {
          throw new Error(response.error.message || 'Sign-in failed')
        }

        await handlePostSignInLogic({
          user: response.data?.user,
          email,
          from,
          navigate,
          setAuthMessage: () => undefined,
          setAuthMessageTone: () => undefined,
        })

        return response.data?.user
      } catch (err: unknown) {
        logger.error('Login failed in useLoginFeature:', err)
        if (err instanceof Error) {
          setError(err.message || 'An unexpected error occurred during login.')
          throw err
        }
        const errorMessage = 'An unexpected error occurred during login.'
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [navigate],
  )

  return { login, isLoading, error, clearError }
}
