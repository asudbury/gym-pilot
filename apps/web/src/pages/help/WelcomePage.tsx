import {
    loadSupabaseProfileFlag,
    loadSupabaseProfileTermsAcceptance,
    logger,
    recordSupabaseUserActivity,
    saveSupabaseProfileTermsAcceptance,
    signOutFromSupabase,
} from '@gym-pilot/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PageCard } from '../../components/PageCard';
import { Heading1 } from '../../components/Typography';
import { Button } from '../../components/ui/Button';
import { DecorativeIcon } from '../../components/ui/DecorativeIcon';
import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification';
import { appTokens } from '../../constants/tokens';
import { recordWelcomeJourneyActivity } from '../../features/auth/domain/welcomeJourneyLogging';

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
        await recordSupabaseUserActivity(
          'welcome_page_viewed',
          { returnTo },
          user.id,
          user.name || user.email || null,
        )

        await recordWelcomeJourneyActivity(
          'welcome_journey_viewed',
          {
            step: 'welcome',
            outcome: 'viewed',
            returnTo,
          },
          user.id,
          user.name || user.email || null,
        )

        // If the user must change password, redirect them to the reset
        // password flow before allowing terms acceptance.
        const requiresPasswordChange = await loadSupabaseProfileFlag(
          'must_change_password',
        )

        if (requiresPasswordChange) {
          await recordWelcomeJourneyActivity(
            'welcome_journey_redirected',
            {
              step: 'welcome',
              outcome: 'password_reset_required',
              returnTo,
              reason: 'must_change_password',
            },
            user.id,
            user.name || user.email || null,
          )

          navigate('/reset-password', {
            replace: true,
            state: { from: returnTo },
          })
          return
        }

        const alreadyAccepted = await loadSupabaseProfileTermsAcceptance(
          user.id,
        )

        if (!isActive) {
          return
        }

        setHasAccepted(alreadyAccepted)
      } catch (error) {
        logger.error(
          '[WelcomePage] Could not load terms acceptance or password flag',
          error,
        )
        await recordWelcomeJourneyActivity(
          'welcome_journey_error',
          {
            step: 'welcome',
            outcome: 'load_failed',
            returnTo,
          },
          user?.id ?? null,
          user?.name || user?.email || null,
        )
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
      await recordWelcomeJourneyActivity(
        'welcome_journey_completed',
        {
          step: 'terms',
          outcome: 'accepted',
          returnTo,
        },
        user.id,
        user.name || user.email || null,
      )
      setHasAccepted(true)
      navigate(returnTo, { replace: true })
    } catch (error) {
      logger.error('[WelcomePage] Could not save terms acceptance', error)
      await recordWelcomeJourneyActivity(
        'welcome_journey_error',
        {
          step: 'welcome',
          outcome: 'accept_failed',
          returnTo,
        },
        user.id,
        user.name || user.email || null,
      )
      setErrorMessage('We could not save your acceptance. Please try again.')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleDecline = async () => {
    try {
      await recordWelcomeJourneyActivity(
        'welcome_journey_completed',
        {
          step: 'terms',
          outcome: 'declined',
          returnTo,
        },
        user?.id ?? null,
        user?.name || user?.email || null,
      )
      await signOutFromSupabase()
    } catch (error) {
      logger.error('[WelcomePage] Could not sign out after decline', error)
    }

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
          <DecorativeIcon icon="document" />{' '}
          <div className="flex flex-col gap-2">
            <Heading1 as="h1">Welcome to Gym-Pilot</Heading1>
            <p className="text-sm text-slate-600">
              Before you continue, please review and accept our terms and
              conditions.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              You can record sessions from the Dashboard (Record a session) or
              from the Timetable page. Trainers and clients can view their
              recorded sessions in the Sessions area.
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
          <StatusMessageNotification message={errorMessage} tone="error" />
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            tone="emerald"
            onClick={handleAccept}
            disabled={isAccepting || hasAccepted}
            >
            {isAccepting
              ? 'Saving…'
              : hasAccepted
                ? 'Accepted'
                : 'Accept and continue'}
          </Button>
          <Button
            tone="default"
            onClick={handleDecline}>
            Decline and log out    
          </Button>
        </div>

        <div className="mt-4 text-sm">
          <p>
            Want to install Gym-Pilot on your iPhone?{' '}
            <Link to="/help/install-ios" className="text-emerald-600">
              Open the install guide
            </Link>
          </p>
        </div>
      </PageCard>
    </div>
  )
}

export default WelcomePage
