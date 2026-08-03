export type LogEntryRow = {
  id: string
  message: string
  details: unknown
  created_at: string | null
}

export type ActivityLogEntryRow = {
  id: string
  event_type: string | null
  event_data: unknown
  created_at: string | null
}

export function formatDetails(details: unknown): string {
  if (!details) {
    return '—'
  }

  if (typeof details === 'string') {
    return details
  }

  try {
    return JSON.stringify(details, null, 2)
  } catch {
    return String(details)
  }
}

export function formatTimestamp(value: string | null): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

export function formatActivityDetails(details: unknown): string {
  if (!details) {
    return '—'
  }

  if (typeof details === 'string') {
    return details
  }

  try {
    return JSON.stringify(details, null, 2)
  } catch {
    return String(details)
  }
}

export function filterLogEntriesByText<T extends Record<string, unknown>>(
  entries: T[],
  filterText: string,
): T[] {
  const normalizedFilter = filterText.trim().toLowerCase()

  if (!normalizedFilter) {
    return entries
  }

  return entries.filter((entry) => {
    const searchableText = [
      typeof entry.message === 'string' ? entry.message : '',
      typeof entry.details === 'string'
        ? entry.details
        : JSON.stringify(entry.details ?? {}),
      typeof entry.event_type === 'string' ? entry.event_type : '',
      typeof entry.event_data === 'string'
        ? entry.event_data
        : JSON.stringify(entry.event_data ?? {}),
    ]
      .join(' ')
      .toLowerCase()

    return searchableText.includes(normalizedFilter)
  })
}
