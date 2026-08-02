import dayjs from 'dayjs'

/**
 * Formats a date object into a string, optionally omitting the year and always omitting seconds.
 *
 * @param date The date to format. Can be a Date object, string, number, or Dayjs object.
 * @param options Formatting options.
 * @param options.includeYear Whether to include the year in the output. Defaults to true.
 * @returns The formatted date string (e.g., "22 May 2023 10:15" or "22 May 10:15").
 */
export function formatDateTime(
  date: dayjs.ConfigType,
  options?: { includeYear?: boolean },
): string {
  const dayjsDate = dayjs(date)
  if (!dayjsDate.isValid()) {
    return 'Invalid Date'
  }

  const { includeYear = false } = options || {}

  return dayjsDate.format(
    includeYear ? 'ddd DD MMM YYYY HH:mm' : 'ddd DD MMM HH:mm',
  )
}
