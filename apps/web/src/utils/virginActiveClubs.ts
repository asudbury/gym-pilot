import { logger } from '@gym-pilot/shared'

export type VirginActiveClub = {
  clubId: number
  name: string
  compositeAddress?: string | null
}

let clubCache: VirginActiveClub[] | null = null
let clubRequest: Promise<VirginActiveClub[]> | null = null

const fallbackClubs: VirginActiveClub[] = [
  { clubId: 76, name: 'Aldersgate' },
  { clubId: 29, name: 'Bank' },
  { clubId: 34, name: 'Bromley' },
  { clubId: 35, name: 'Canary Riverside' },
  { clubId: 953, name: 'Cannon Street (Walbrook)' },
  { clubId: 27, name: 'Chelmsford' },
  { clubId: 421, name: 'Chiswick Park' },
  { clubId: 405, name: 'Chiswick Riverside' },
  { clubId: 38, name: 'Clapham' },
  { clubId: 438, name: 'Clearview/Brentwood' },
  { clubId: 39, name: 'Crouch End' },
  { clubId: 47, name: 'Fulham Pools' },
  { clubId: 12, name: 'Islington Angel' },
  { clubId: 51, name: 'Kensington' },
  { clubId: 56, name: 'Mayfair' },
  { clubId: 57, name: 'Mill Hill' },
  { clubId: 59, name: 'Moorgate' },
  { clubId: 415, name: 'Northampton Collingtree Park' },
  { clubId: 2, name: 'Northampton Riverside Park' },
  { clubId: 60, name: 'Notting Hill' },
  { clubId: 61, name: 'Nottingham' },
  { clubId: 422, name: 'Repton Park' },
  { clubId: 452, name: 'Salford Quays' },
  { clubId: 15, name: 'Sheffield Broadfield Park' },
  { clubId: 6, name: 'Solihull' },
  { clubId: 68, name: 'Strand' },
  { clubId: 69, name: 'Streatham' },
  { clubId: 410, name: 'Swiss Cottage' },
  { clubId: 16, name: 'Thundersley' },
  { clubId: 425, name: 'Wandsworth Smugglers Way' },
  { clubId: 408, name: 'Wimbledon Worple Road' },
]

function normalizeClubs(payload: unknown): VirginActiveClub[] {
  if (Array.isArray(payload)) {
    return payload
      .filter((item): item is Record<string, unknown> =>
        Boolean(item && typeof item === 'object'),
      )
      .map((item) => ({
        clubId:
          typeof item.clubId === 'number'
            ? item.clubId
            : Number(item.clubId) || 0,
        name: typeof item.name === 'string' ? item.name : '',
        compositeAddress:
          typeof item.compositeAddress === 'string'
            ? item.compositeAddress
            : null,
      }))
      .filter((club) => club.clubId > 0 && club.name.trim().length > 0)
  }

  if (payload && typeof payload === 'object') {
    const candidate = payload as Record<string, unknown>
    const clubs = Array.isArray(candidate.clubs) ? candidate.clubs : []

    return normalizeClubs(clubs)
  }

  return []
}

export function getFallbackVirginActiveClubs(): VirginActiveClub[] {
  return fallbackClubs
}

export async function loadVirginActiveClubs(): Promise<VirginActiveClub[]> {
  if (clubCache) {
    return clubCache
  }

  if (clubRequest) {
    return clubRequest
  }

  clubRequest = (async () => {
    const endpoint = import.meta.env.VITE_VIRGIN_ACTIVE_CLUBS_URL as
      string | undefined

    if (endpoint) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            Accept: 'application/json',
          },
        })

        if (response.ok) {
          const payload = await response.json()
          const clubs = normalizeClubs(payload)

          if (clubs.length > 0) {
            clubCache = clubs
            return clubs
          }
        }
      } catch (error) {
        logger.warn(
          '[VirginActive] Could not load clubs from configured endpoint',
          error,
        )
      }
    }

    clubCache = fallbackClubs
    return fallbackClubs
  })()

  try {
    return await clubRequest
  } finally {
    clubRequest = null
  }
}
