const localDevelopmentHosts = new Set(['localhost', '127.0.0.1', '::1'])

type AuthProtectionOptions = {
  bypassRequested: boolean
  hostname?: string
  isDevelopment: boolean
}

export function resolveAuthProtectionEnabled({
  bypassRequested,
  hostname,
  isDevelopment,
}: AuthProtectionOptions) {
  const isSafeLocalDevelopmentHost = Boolean(
    hostname && localDevelopmentHosts.has(hostname),
  )

  return !(isDevelopment && bypassRequested && isSafeLocalDevelopmentHost)
}

export const AUTH_PROTECTION_ENABLED = resolveAuthProtectionEnabled({
  bypassRequested: import.meta.env?.VITE_AUTH_PROTECTION_ENABLED === 'false',
  hostname:
    typeof window === 'undefined' ? undefined : window.location.hostname,
  isDevelopment: import.meta.env.DEV,
})
