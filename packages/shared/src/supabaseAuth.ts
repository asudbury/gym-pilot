import { getSupabaseClient } from './supabase'
import { logger } from './logging'

/**
 * Resolve the current authenticated user id from the active Supabase session.
 */
export async function getAuthenticatedUserId(client: ReturnType<typeof getSupabaseClient>): Promise<string | null> {
  if (!client) {
    return null
  }

  try {
    const { data: { session }, error } = await client.auth.getSession()

    if (error) {
      logger.warn('[Supabase] Could not resolve authenticated session', error)
      return null
    }

    const userId = session?.user?.id ?? null

    if (!userId) {
      logger.info('[Supabase] No active session yet; skipping remote persistence work')
      return null
    }

    logger.info('[Supabase] Resolved authenticated user', { userId })
    return userId
  } catch (error) {
    logger.warn('[Supabase] Session lookup failed', error)
    return null
  }
}
