import dayjs from 'dayjs'

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1:
      return 'st'
    case 2:
      return 'nd'
    case 3:
      return 'rd'
    default:
      return 'th'
  }
}

/**
 * Formats a date object into a string, optionally omitting the year and always omitting seconds.
 *
 * @param date The date to format. Can be a Date object, string, number, or Dayjs object.
 * @param options Formatting options.
 * @param options.includeYear Whether to include the year in the output. Defaults to true.
 * @returns The formatted date string (e.g., "22nd May 2023 10:15" or "22nd May 10:15").
 */
export function formatDateTimeForDisplay(
  date: dayjs.ConfigType,
  options?: { includeYear?: boolean },
): string {
  const dayjsDate = dayjs(date)
  if (!dayjsDate.isValid()) {
    return 'Invalid Date'
  }

  const { includeYear = false } = options || {}
  const day = dayjsDate.date()
  const ordinalSuffix = getOrdinalSuffix(day)

  const formatString = includeYear
    ? `ddd D[${ordinalSuffix}] MMM YYYY [at] HH:mm`
    : `ddd D[${ordinalSuffix}] MMM [at] HH:mm`

  return dayjsDate.format(formatString)
}

/**
 * Formats a date object into a string, optionally omitting the year.
 * Includes ordinal suffixes for the day.
 *
 * @param date The date to format. Can be a Date object, string, number, or Dayjs object.
 * @param options Formatting options.
 * @param options.includeYear Whether to include the year in the output. Defaults to true.
 * @returns The formatted date string (e.g., "Mon 22nd May 2023" or "Mon 22nd May").
 */
export function formatDateForDisplay(
  date: dayjs.ConfigType,
  options?: { includeYear?: boolean },
): string {
  const dayjsDate = dayjs(date)
  if (!dayjsDate.isValid()) {
    return 'Invalid Date'
  }

  const { includeYear = true } = options || {} // Default includeYear to true for date-only format
  const day = dayjsDate.date()
  const ordinalSuffix = getOrdinalSuffix(day)

  const formatString = includeYear
    ? `ddd D[${ordinalSuffix}] MMM YYYY`
    : `ddd D[${ordinalSuffix}] MMM`

  return dayjsDate.format(formatString)
}
