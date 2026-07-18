import webPackageJson from '../../package.json'

export type BuildMetadata = {
  appVersion: string
  buildDate: string
  buildTime: string
  buildTimestamp: string
  commitSha: string
  branch: string
}

function readEnvValue(value: string | undefined) {
  return value?.trim() || undefined
}

function formatFriendlyTimestamp(buildDate: string, buildTime: string): string {
  if (buildDate === 'Unknown' || buildTime === 'Unknown') {
    return 'Unknown'
  }

  const dateValue = new Date(`${buildDate}T${buildTime.replace(/ UTC$/, '')}`)

  if (Number.isNaN(dateValue.getTime())) {
    return `${buildDate} ${buildTime}`
  }

  const day = dateValue.getDate()
  const month = dateValue.toLocaleDateString('en-GB', { month: 'short' })
  const year = dateValue.getFullYear()
  const time = dateValue.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const timezone = buildTime.includes('UTC') ? 'UTC' : ''

  return `${day} ${month} ${year} at ${time}${timezone ? ` ${timezone}` : ''}`
}

export function getBuildMetadata(env: Record<string, string | undefined> = import.meta.env): BuildMetadata {
  const appVersion = readEnvValue(env.VITE_APP_VERSION) || webPackageJson.version || '0.0.0'
  const buildDate = readEnvValue(env.VITE_BUILD_DATE) || 'Unknown'
  const buildTime = readEnvValue(env.VITE_BUILD_TIME) || 'Unknown'
  const commitSha = readEnvValue(env.VITE_GIT_COMMIT_SHA) || 'Unknown'
  const branch = readEnvValue(env.VITE_GIT_BRANCH) || 'Unknown'

  return {
    appVersion,
    buildDate,
    buildTime,
    buildTimestamp: formatFriendlyTimestamp(buildDate, buildTime),
    commitSha,
    branch,
  }
}
