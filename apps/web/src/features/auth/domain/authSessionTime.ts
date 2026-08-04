export function formatSessionTimeRemaining(
  expiresAt: number | null | undefined,
  now = Math.floor(Date.now() / 1000),
): string {
  if (typeof expiresAt !== 'number' || Number.isNaN(expiresAt)) {
    return 'Unavailable'
  }

  const remainingSeconds = Math.max(0, Math.floor(expiresAt - now))

  if (remainingSeconds === 0) {
    return 'Expired'
  }

  const hours = Math.floor(remainingSeconds / 3600)
  const minutes = Math.floor((remainingSeconds % 3600) / 60)

  return `${hours}h ${minutes.toString().padStart(2, '0')}m`
}
