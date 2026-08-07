export interface ParsedExercise {
  name: string
  reps: string
  sets: string
  performance: string
}

export interface ParsedSession {
  date: string
  exercises: ParsedExercise[]
  time?: string
  calories?: string
  energy?: number
  unit?: string
  warmUp?: string
  stretch?: string
}

function parseEnergy(value: string): { energy?: number; unit?: string } {
  if (!value) {
    return {}
  }
  const kcalMatch = value.match(/(\d+)\s*(kcal|kal)/i)
  if (kcalMatch) {
    return { energy: parseInt(kcalMatch[1], 10), unit: 'kcal' }
  }
  const kjMatch = value.match(/(\d+)\s*kj/i)
  if (kjMatch) {
    return { energy: parseInt(kjMatch[1], 10), unit: 'kj' }
  }
  return {}
}

function parseTable(table: string): ParsedSession[] {
  const lines = table.split(/\r?\n/).filter((line) => line.trim() !== '')
  if (lines.length < 2) return []

  const dateRowIndex = lines.findIndex((line) =>
    line.trim().toUpperCase().startsWith('DATE'),
  )
  if (dateRowIndex === -1) return []

  const dateRowCells = lines[dateRowIndex].split('	')

  const dataStartIndex = dateRowCells.findIndex(
    (cell, index) => index > 1 && cell.trim() !== '' && cell.trim() !== '-',
  )
  if (dataStartIndex === -1) return []

  const dates = dateRowCells.slice(dataStartIndex).filter((d) => d.trim())
  if (dates.length === 0) return []

  const sessions: ParsedSession[] = dates.map((date) => ({
    date: date.trim(),
    exercises: [],
  }))

  for (const line of lines) {
    if (
      line.trim().toUpperCase().startsWith('DATE') ||
      line.trim().toUpperCase().startsWith('EXERCISE')
    )
      continue

    const columns = line.split('	')
    const itemName = columns[0].trim()
    if (!itemName) continue

    const performances = columns.slice(dataStartIndex)

    if (itemName.toLowerCase().includes('time + calories')) {
      performances.forEach((value, index) => {
        if (sessions[index] && value.trim()) {
          const parts = value.trim().split(/\s+/)
          sessions[index].time = parts[0]
          if (parts.length > 1) {
            const calorieString = parts.slice(1).join(' ')
            sessions[index].calories = calorieString
            const { energy, unit } = parseEnergy(calorieString)
            if (energy) {
              sessions[index].energy = energy
            }
            if (unit) {
              sessions[index].unit = unit
            }
          }
        }
      })
    } else if (itemName.toLowerCase().includes('warm up')) {
      performances.forEach((value, index) => {
        if (sessions[index] && value.trim()) {
          sessions[index].warmUp = value.trim()
        }
      })
    } else if (itemName.toLowerCase().includes('stretch')) {
      performances.forEach((value, index) => {
        if (sessions[index] && value.trim()) {
          sessions[index].stretch = value.trim()
        }
      })
    } else {
      // Exercise row
      // TODO: handle multi-exercise lines like "(1) lat raises (2) bicep curls"
      const reps = columns.length > 1 ? columns[1].trim() : ''
      const sets = columns.length > 2 ? columns[2].trim() : ''

      performances.forEach((performance, index) => {
        const p = performance.trim()
        if (
          sessions[index] &&
          p &&
          !['missed', 'x', ''].includes(p.toLowerCase())
        ) {
          sessions[index].exercises.push({
            name: itemName,
            reps,
            sets,
            performance: p,
          })
        }
      })
    }
  }

  return sessions.filter(
    (s) => s.exercises.length > 0 || !!s.warmUp || !!s.stretch || !!s.time,
  )
}

export const parseSpreadsheet = (input: string): ParsedSession[] => {
  const lines = input.split(/\r?\n/)
  const tables: string[] = []
  let currentTableLines: string[] = []

  for (const line of lines) {
    if (line.trim().startsWith('DATE')) {
      if (currentTableLines.some((l) => l.trim().startsWith('DATE'))) {
        tables.push(currentTableLines.join('\n'))
        currentTableLines = [line]
      } else {
        currentTableLines.push(line)
      }
    } else {
      currentTableLines.push(line)
    }
  }

  if (currentTableLines.length > 0) {
    tables.push(currentTableLines.join('\n'))
  }

  const allSessions = tables.flatMap((table) => parseTable(table))

  return allSessions
}
