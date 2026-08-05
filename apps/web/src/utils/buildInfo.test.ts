import { describe, expect, it } from 'vitest'
import { getBuildMetadata } from './buildInfo'

describe('getBuildMetadata', () => {
  it('uses injected build information when present', () => {
    expect(
      getBuildMetadata({
        VITE_APP_VERSION: '1.2.3',
        VITE_BUILD_DATE: '2026-07-18',
        VITE_BUILD_TIME: '10:30:00 UTC',
        VITE_GIT_COMMIT_SHA: 'abc1234',
        VITE_GIT_BRANCH: 'main',
      }),
    ).toEqual({
      appVersion: '1.2.3',
      buildDate: '2026-07-18',
      buildTime: '10:30:00 UTC',
      buildTimestamp: 'Sat 18th Jul 2026 at 11:30',
      commitSha: 'abc1234',
      branch: 'main',
    })
  })

  it('formats the timestamp using UTC values', () => {
    expect(
      getBuildMetadata({
        VITE_BUILD_DATE: '2026-07-18',
        VITE_BUILD_TIME: '23:45:00 UTC',
      }).buildTimestamp,
    ).toBe('Sun 19th Jul 2026 at 00:45')
  })

  it('falls back to the package version and unknown values when no metadata is injected', () => {
    const metadata = getBuildMetadata({})

    expect(metadata.appVersion).toBeTruthy()
    expect(metadata.buildDate).toBe('Unknown')
    expect(metadata.buildTime).toBe('Unknown')
    expect(metadata.buildTimestamp).toBe('Unknown')
    expect(metadata.commitSha).toBe('Unknown')
    expect(metadata.branch).toBe('Unknown')
  })
})
