import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockGetSession,
  mockLoadSupabaseProfileSnapshot,
  mockLoadSupabaseProfileAccessState,
  mockSaveSupabaseProfileLastLoggedIn,
  mockSaveSupabaseProfileName,
  mockSaveSupabaseProfileEmail,
  mockSignOutFromSupabase,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockLoadSupabaseProfileSnapshot: vi.fn(),
  mockLoadSupabaseProfileAccessState: vi.fn(),
  mockSaveSupabaseProfileLastLoggedIn: vi.fn(),
  mockSaveSupabaseProfileName: vi.fn(),
  mockSaveSupabaseProfileEmail: vi.fn(),
  mockSignOutFromSupabase: vi.fn(),
}))

vi.mock('@gym-pilot/shared', async () => {
  const actual =
    await vi.importActual<typeof import('@gym-pilot/shared')>(
      '@gym-pilot/shared',
    )

  return {
    ...actual,
    getSupabaseClient: vi.fn(() => ({
      auth: {
        getSession: mockGetSession,
      },
    })),
    loadSupabaseProfileAccessState: mockLoadSupabaseProfileAccessState,
    loadSupabaseProfileSnapshot: mockLoadSupabaseProfileSnapshot,
    logger: {
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    },
    normalizeUserRoles: (roles?: string[], role?: string) => {
      if (Array.isArray(roles) && roles.length > 0) {
        return roles
      }

      return role ? [role] : ['client']
    },
    saveSupabaseApplicationName: vi.fn(),
    saveSupabaseGymBrand: vi.fn(),
    saveSupabaseProfileEmail: mockSaveSupabaseProfileEmail,
    saveSupabaseGymName: vi.fn(),
    saveSupabaseProfileLastLoggedIn: mockSaveSupabaseProfileLastLoggedIn,
    saveSupabaseProfileName: mockSaveSupabaseProfileName,
    signOutFromSupabase: mockSignOutFromSupabase,
  }
})

import { resolveSupabaseAuthUser } from './authSession'

const mockedLoadSupabaseProfileSnapshot = vi.mocked(
  mockLoadSupabaseProfileSnapshot,
)
const mockedLoadSupabaseProfileAccessState = vi.mocked(
  mockLoadSupabaseProfileAccessState,
)
const mockedSaveSupabaseProfileLastLoggedIn = vi.mocked(
  mockSaveSupabaseProfileLastLoggedIn,
)
const mockedSaveSupabaseProfileName = vi.mocked(mockSaveSupabaseProfileName)
const mockedSaveSupabaseProfileEmail = vi.mocked(mockSaveSupabaseProfileEmail)

describe('resolveSupabaseAuthUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-1',
            email: 'ada@example.com',
            user_metadata: {
              full_name: 'Ada Lovelace',
            },
          },
        },
      },
      error: null,
    })

    mockedLoadSupabaseProfileSnapshot.mockResolvedValue({
      friendlyName: 'Ada Lovelace',
      applicationName: null,
      gymBrand: null,
      gymName: null,
      gymClubId: null,
      accountTier: 'free',
      accessEndsAt: null,
      isFrozen: false,
      lastLoggedInAt: null,
      previousLastLoggedInAt: null,
      mustChangePassword: false,
      termsAccepted: true,
      termsAcceptedAt: null,
      roles: [],
      trainerId: null,
      email: 'ada@example.com',
    })

    mockedLoadSupabaseProfileAccessState.mockResolvedValue({ isBlocked: false })
  })

  it('does not update the last-login timestamp during session restoration', async () => {
    await resolveSupabaseAuthUser([])

    expect(mockedSaveSupabaseProfileLastLoggedIn).not.toHaveBeenCalled()
  })

  it('does not re-upsert the same profile name or email during session restoration', async () => {
    await resolveSupabaseAuthUser([])

    expect(mockedSaveSupabaseProfileName).not.toHaveBeenCalled()
    expect(mockedSaveSupabaseProfileEmail).not.toHaveBeenCalled()
  })
})
