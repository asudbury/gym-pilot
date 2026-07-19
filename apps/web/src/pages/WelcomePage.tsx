import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  loadSupabaseProfileTermsAcceptance,
  logger,
  saveSupabaseProfileTermsAcceptance,
  signOutFromSupabase,
} from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { Heading1 } from '../components/Typography'
import { appTokens } from '../constants/tokens'
import { useAuth } from '../auth/AuthContext'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'

export function WelcomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [isAccepting, setIsAccepting] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const returnTo = useMemo(() => {
    const nextPath = searchParams.get('returnTo')?.trim()
    return nextPath && nextPath.startsWith('/') ? nextPath : '/'
  }, [searchParams])

  useEffect(() => {
    let isActive = true

    void (async () => {
      if (!user?.id) {
        return
      }

      try {
        const alreadyAccepted = await loadSupabaseProfileTermsAcceptance(
          user.id,
        )

        if (!isActive) {
          return
        }

        setHasAccepted(alreadyAccepted)
      } catch (error) {
        logger.error('[WelcomePage] Could not load terms acceptance', error)
      }
    })()

    return () => {
      isActive = false
    }
  }, [user?.id])

  const handleAccept = async () => {
    if (!user?.id) {
      setErrorMessage('You need an authenticated account to continue.')
      return
    }

    setIsAccepting(true)
    setErrorMessage(null)

    try {
      await saveSupabaseProfileTermsAcceptance(true, user.id)
      setHasAccepted(true)
      navigate(returnTo, { replace: true })
    } catch (error) {
      logger.error('[WelcomePage] Could not save terms acceptance', error)
      setErrorMessage('We could not save your acceptance. Please try again.')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDecline = async () => {
    try {
      await signOutFromSupabase()
    } catch (error) {
      logger.error('[WelcomePage] Could not sign out after decline', error)
    }

    window.dispatchEvent(new Event('gym-pilot-auth-updated'))
    navigate('/login', { replace: true })
  }

  return (
    <div className={`${appTokens.pageShell} flex items-start justify-center`}>
      <PageCard
        as="section"
        className="w-full max-w-3xl self-start"
        padding="spacious"
      >
        <div className="flex items-start gap-3">
          <DecorativeIcon icon="clipboard" />
          <div className="flex flex-col gap-2">
            <Heading1 as="h1">Welcome to Gym-Pilot</Heading1>
            <p className="text-sm text-slate-600">
              Before you continue, please review and accept our terms and
              conditions.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">
            Terms and conditions
          </h2>
          <ul className="mt-4 space-y-2 list-disc pl-5">
            <li>
              You are responsible for the information you provide in this app.
            </li>
            <li>Use this service lawfully and respectfully.</li>
            <li>Do not share your account credentials with anyone else.</li>
            <li>
              We may update these terms from time to time and your continued use
              means you accept the latest version.
            </li>
          </ul>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isAccepting || hasAccepted}
            className="rounded-full border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:border-emerald-300 disabled:bg-emerald-300 disabled:text-emerald-950"
          >
            {isAccepting
              ? 'Saving…'
              : hasAccepted
                ? 'Accepted'
                : 'Accept and continue'}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Decline and sign out
          </button>
        </div>
      </PageCard>
    </div>
  )
}
