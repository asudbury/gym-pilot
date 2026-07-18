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
    buildTimestamp: buildDate === 'Unknown' || buildTime === 'Unknown'
      ? 'Unknown'
      : `${buildDate} ${buildTime}`,
    commitSha,
    branch,
  }
}
