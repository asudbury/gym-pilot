export interface SpreadsheetWorkoutImportSessionPayload {
  session: {
    user_id: string
    session_id: string
    session_type: 'solo'
    start_at: string
    duration_minutes: number | null
    trainer_id: string | null
    trainer_name: string | null
    class_id: string | null
    class_name: string | null
    location: string | null
    capacity: number | null
    price: number | null
    metadata: Record<string, unknown>
    role: 'client' | null
    status: 'attended' | null
    notes: string | null
    rating: number | null
    attendance_type: 'attended' | null
  }
  workout_items: Array<{
    session_id: string
    user_id: string
    item_index: number
    category: 'exercise' | 'warm_up' | 'stretch' | 'cool_down' | 'run' | 'spin'
    exercise_name: string | null
    reps: string | null
    sets: string | null
    weight: string | null
    duration_minutes: string | null
    distance_km: string | null
    speed_kph: string | null
    notes: string | null
    plan_item_id: string | null
  }>
}

export interface SpreadsheetWorkoutImportOptions {
  userId: string
  referenceYear: number
}

export interface SpreadsheetWorkoutImportPreviewItem {
  payload: SpreadsheetWorkoutImportSessionPayload
  selected: boolean
}

export function getSelectedSpreadsheetImportPayloads(
  previewItems: SpreadsheetWorkoutImportPreviewItem[],
): SpreadsheetWorkoutImportSessionPayload[] {
  return previewItems
    .filter((item) => item.selected)
    .map((item) => item.payload)
}

export function updateSpreadsheetImportPreviewDuration(
  payload: SpreadsheetWorkoutImportSessionPayload,
  durationMinutes: number | null,
): SpreadsheetWorkoutImportSessionPayload {
  return {
    ...payload,
    session: {
      ...payload.session,
      duration_minutes: durationMinutes,
    },
  }
}

export function updateSpreadsheetImportPreviewDate(
  payload: SpreadsheetWorkoutImportSessionPayload,
  startAt: string,
): SpreadsheetWorkoutImportSessionPayload {
  return {
    ...payload,
    session: {
      ...payload.session,
      start_at: startAt,
    },
  }
}

export function toggleSpreadsheetImportPreviewSelection(
  previewItems: SpreadsheetWorkoutImportPreviewItem[],
  index: number,
): SpreadsheetWorkoutImportPreviewItem[] {
  return previewItems.map((item, itemIndex) =>
    itemIndex === index ? { ...item, selected: !item.selected } : item,
  )
}

export function updateSpreadsheetImportPreviewItem(
  previewItems: SpreadsheetWorkoutImportPreviewItem[],
  index: number,
  updates: Partial<SpreadsheetWorkoutImportPreviewItem>,
): SpreadsheetWorkoutImportPreviewItem[] {
  return previewItems.map((item, itemIndex) =>
    itemIndex === index ? { ...item, ...updates } : item,
  )
}

interface WorkbookSheetInput {
  name?: string
  rows: string[][]
}

interface WorkbookInput {
  sheets: WorkbookSheetInput[]
}

function splitRows(content: string): string[][] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').filter((line) => line.trim().length > 0)

  if (lines.length === 0) {
    return []
  }

  const hasTabs = lines.some((line) => line.includes('\t'))
  const hasCommas = lines.some((line) => line.includes(','))

  if (hasTabs && !hasCommas) {
    return lines.map((line) => line.split('\t'))
  }

  if (hasCommas) {
    const parsed: string[][] = []
    for (const line of lines) {
      const cells: string[] = []
      let current = ''
      let inQuotes = false

      for (let index = 0; index < line.length; index += 1) {
        const character = line[index]
        if (character === '"') {
          if (inQuotes && line[index + 1] === '"') {
            current += '"'
            index += 1
          } else {
            inQuotes = !inQuotes
          }
          continue
        }

        if (character === ',' && !inQuotes) {
          cells.push(current.trim())
          current = ''
          continue
        }

        current += character
      }

      cells.push(current.trim())
      parsed.push(cells)
    }

    return parsed
  }

  return lines.map((line) => [line.trim()])
}

function parseDateLabel(value: string, referenceYear: number): string | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed === '-') {
    return null
  }

  const dayMatch = trimmed.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+/i)
  if (!dayMatch) {
    return null
  }

  const day = Number(dayMatch[1])
  const monthName = trimmed.slice(dayMatch[0].length).trim().toLowerCase()
  const monthMap = new Map([
    ['jan', 0],
    ['january', 0],
    ['feb', 1],
    ['february', 1],
    ['mar', 2],
    ['march', 2],
    ['apr', 3],
    ['april', 3],
    ['may', 4],
    ['jun', 5],
    ['june', 5],
    ['jul', 6],
    ['july', 6],
    ['aug', 7],
    ['august', 7],
    ['sep', 8],
    ['sept', 8],
    ['sep', 8],
    ['sept', 8],
    ['oct', 9],
    ['october', 9],
    ['nov', 10],
    ['november', 10],
    ['dec', 11],
    ['december', 11],
  ])

  const month = monthMap.get(monthName)
  if (month === undefined) {
    return null
  }

  const date = new Date(Date.UTC(referenceYear, month, day, 0, 0, 0))
  return date.toISOString()
}

function normalizeCategory(
  exerciseName: string,
): SpreadsheetWorkoutImportSessionPayload['workout_items'][number]['category'] {
  const lower = exerciseName.toLowerCase()
  if (lower.includes('warm up')) {
    return 'warm_up'
  }
  if (lower.includes('stretch')) {
    return 'stretch'
  }
  if (lower.includes('cool')) {
    return 'cool_down'
  }
  if (lower.includes('run')) {
    return 'run'
  }
  if (lower.includes('spin')) {
    return 'spin'
  }
  return 'exercise'
}

function parseCellValue(value: string): string | null {
  if (!value || value.trim() === '-' || value.trim() === '') {
    return null
  }

  return value.trim()
}

function extractWeight(value: string | null): string | null {
  if (!value) {
    return null
  }

  const match = value.match(/(\d+(?:\.\d+)?)(?:\s*)(kg|lb)/i)
  return match ? `${match[1]}${match[2].toLowerCase()}` : null
}

function parseDurationMinutes(value: string | null): number | null {
  if (!value) {
    return null
  }

  const match = value.match(
    /(\d+(?:\.\d+)?)(?:\s*)(m|min|mins|minutes|minute)\b/i,
  )
  if (!match) {
    // also support hh:mm style durations (e.g. "0:52 318kcal")
    const timeMatch = value.match(/(\d{1,2}):(\d{2})/)
    if (timeMatch) {
      const hours = Number(timeMatch[1])
      const mins = Number(timeMatch[2])
      const total = hours * 60 + mins
      return Number.isFinite(total) ? total : null
    }

    return null
  }

  const minutes = Number(match[1])
  return Number.isFinite(minutes) ? minutes : null
}

function isDateRow(row: string[]): boolean {
  if (row.length < 4) {
    return false
  }

  const prefix = (row[0] ?? '').trim().toLowerCase()
  if (prefix !== 'date') {
    return false
  }

  return row.slice(3).some((cell) => parseDateLabel(cell, 2000) !== null)
}

function findDateRow(rows: string[][]): string[] | null {
  const candidateRows = rows.filter((row) =>
    row.some((cell) => cell.trim().length > 0),
  )

  for (const row of candidateRows) {
    if (isDateRow(row)) {
      return row
    }
  }

  return null
}

function findHeaderRow(rows: string[][]): string[] | null {
  const candidateRows = rows.filter((row) =>
    row.some((cell) => cell.trim().length > 0),
  )

  for (const row of candidateRows) {
    const firstCell = (row[0] ?? '').trim().toLowerCase()
    if (firstCell === 'exercise' || firstCell === 'name') {
      return row
    }
  }

  return null
}

export function buildSpreadsheetWorkoutImportPayloads(
  content: string | WorkbookInput,
  options: SpreadsheetWorkoutImportOptions,
): SpreadsheetWorkoutImportSessionPayload[] {
  const sheetInputs: WorkbookSheetInput[] =
    typeof content === 'string'
      ? [{ name: 'default', rows: splitRows(content) }]
      : content.sheets

  const payloads: SpreadsheetWorkoutImportSessionPayload[] = []

  for (const sheet of sheetInputs) {
    const rows = sheet.rows.filter((row) =>
      row.some((cell) => cell.trim().length > 0),
    )

    if (rows.length < 2) {
      continue
    }

    const dateRow = findDateRow(rows) ?? findHeaderRow(rows)
    if (!dateRow) {
      continue
    }

    const dateRowIndex = rows.findIndex((row) => row === dateRow)
    const workoutRows = rows.slice(dateRowIndex + 1).filter((row) => {
      const exerciseName = parseCellValue(row[0] ?? '')
      return Boolean(
        exerciseName && exerciseName.toLowerCase() !== 'time + calories',
      )
    })

    const summaryRow = rows
      .slice(dateRowIndex + 1)
      .find(
        (row) =>
          parseCellValue(row[0] ?? '')?.toLowerCase() === 'time + calories',
      )

    for (
      let weekIndex = 0;
      weekIndex < dateRow.slice(3).length;
      weekIndex += 1
    ) {
      const weekLabel = `Week ${weekIndex + 1}`
      const dateValue = dateRow[3 + weekIndex] ?? ''
      const startAt = parseDateLabel(dateValue, options.referenceYear)

      if (!startAt) {
        continue
      }

      const workoutItems: SpreadsheetWorkoutImportSessionPayload['workout_items'] =
        []

      for (const row of workoutRows) {
        const cellValue = parseCellValue(row[3 + weekIndex] ?? '')
        if (!cellValue) {
          continue
        }

        const exerciseName = parseCellValue(row[0] ?? '')
        if (!exerciseName) {
          continue
        }

        workoutItems.push({
          session_id: `numbers:${options.userId}:${startAt}:${weekIndex}:${sheet.name ?? 'default'}`,
          user_id: options.userId,
          item_index: workoutItems.length,
          category: normalizeCategory(exerciseName),
          exercise_name: exerciseName,
          reps: parseCellValue(row[1] ?? ''),
          sets: parseCellValue(row[2] ?? ''),
          weight: extractWeight(cellValue),
          duration_minutes: null,
          distance_km: null,
          speed_kph: null,
          notes: cellValue,
          plan_item_id: null,
        })
      }

      if (workoutItems.length === 0) {
        continue
      }

      const summaryValue = summaryRow
        ? parseCellValue(summaryRow[3 + weekIndex] ?? '')
        : null
      const durationMinutes = parseDurationMinutes(summaryValue)

      payloads.push({
        session: {
          user_id: options.userId,
          session_id: `numbers:${options.userId}:${startAt}:${weekIndex}:${sheet.name ?? 'default'}`,
          session_type: 'solo',
          start_at: startAt,
          duration_minutes: durationMinutes,
          trainer_id: null,
          trainer_name: null,
          class_id: null,
          class_name: null,
          location: null,
          capacity: null,
          price: null,
          metadata: {
            source: 'numbers',
            summary: summaryValue,
            week_label: weekLabel,
            sheet_name: sheet.name ?? 'default',
          },
          role: 'client',
          status: 'attended',
          notes: [
            'Imported',
            `${weekLabel}: ${summaryValue ?? 'Workout logged'}`,
          ].join('\n'),
          rating: null,
          attendance_type: 'attended',
        },
        workout_items: workoutItems,
      })
    }
  }

  return payloads
}
