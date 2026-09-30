import { exercises } from '@gym-pilot/shared'
import type { PlanSession } from '@gym-pilot/types'

export interface PlanGridRow {
  id: string
  exerciseId: string
  reps: string
  workingSets: string
  notes: string
  linkLabel?: string
  linkUrl?: string
  [key: string]: string | undefined
}

export interface PlanTab {
  id: string
  title: string
  rows: PlanGridRow[]
}

/** Returns a unique ID for a new plan row or tab. */
export function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}

/**
 * Creates a blank plan grid row with an optional pre-selected exercise.
 * @param exerciseId - Optional exercise ID to pre-populate.
 */
export function createBlankRow(exerciseId = ''): PlanGridRow {
  return {
    id: createId(),
    exerciseId,
    reps: '',
    workingSets: '',
    notes: '',
  }
}

/**
 * Creates a link row for use in plan sessions (e.g. a YouTube or reference link).
 * @param linkLabel - Display label for the link.
 * @param linkUrl - URL the link points to.
 */
export function createLinkRow(linkLabel = '', linkUrl = ''): PlanGridRow {
  return {
    id: createId(),
    exerciseId: '',
    reps: '',
    workingSets: '',
    notes: '',
    linkLabel,
    linkUrl,
  }
}

/**
 * Creates a blank plan tab with the given title and no rows.
 * @param title - The display title for the tab.
 */
export function createBlankTab(title: string): PlanTab {
  return {
    id: createId(),
    title,
    rows: [],
  }
}

/**
 * Converts plan builder tabs into a PlanSession[] ready for persistence.
 * Filters out empty rows, resolves exercise names, and preserves link rows.
 * Fallback title is `Day N` when the tab title is blank.
 *
 * @param tabs - The current plan builder tab state.
 * @returns Array of PlanSession ready for saving.
 */
export function buildPlanSessionsFromTabs(tabs: PlanTab[]): PlanSession[] {
  return tabs.map((tab, index) => ({
    id: tab.id,
    title: tab.title.trim() || `Day ${index + 1}`,
    planItems: tab.rows
      .filter((row) => row.exerciseId || row.linkUrl)
      .map((row) => {
        const exercise = exercises.find((item) => item.id === row.exerciseId)
        const linkLabel = row.linkLabel?.trim()
        const linkUrl = row.linkUrl?.trim()

        return {
          id: row.exerciseId || row.id,
          name: exercise?.name ?? linkLabel ?? row.exerciseId ?? 'Link',
          exercise_id: row.exerciseId,
          exercise_name:
            exercise?.name ?? linkLabel ?? row.exerciseId ?? 'Link',
          reps: row.reps ?? '',
          workingSets: row.workingSets ?? '',
          notes: linkUrl || (row.notes ?? ''),
          link_label: linkLabel || undefined,
          link_url: linkUrl || undefined,
        }
      }),
  }))
}

/**
 * Converts saved PlanSession[] back into plan builder tabs for editing.
 * Preserves exercise IDs, link rows, notes, reps, and sets.
 * Falls back to a single blank "Day 1" tab when sessions are empty.
 *
 * @param sessions - Persisted plan sessions to hydrate into tabs.
 * @returns Array of PlanTab representing the editable builder state.
 */
export function buildTabsFromSessions(
  sessions: PlanSession[] | undefined,
): PlanTab[] {
  if (!sessions || sessions.length === 0) {
    return [createBlankTab('Day 1')]
  }

  return sessions.map((session, index) => {
    const tab = createBlankTab(session.title?.trim() || `Day ${index + 1}`)
    tab.rows = (session.planItems ?? []).map((item) => {
      if (item.link_url || item.link_label) {
        const row = createLinkRow(
          item.link_label || item.exercise_name || 'Link',
          item.link_url || item.notes || '',
        )
        row.notes = item.notes ?? ''
        row.reps = item.reps ?? ''
        row.workingSets = item.workingSets ?? ''
        return row
      }

      const row = createBlankRow(item.exercise_id || item.id)
      row.notes = item.notes ?? ''
      row.reps = item.reps ?? ''
      row.workingSets = item.workingSets ?? ''
      return row
    })
    return tab
  })
}

/**
 * Sanitises a string for use as an Excel sheet name.
 * Removes characters forbidden by Excel (`/ * ? : [ ]`) and truncates to 31 characters.
 * Falls back to `'Sheet'` when the result would be empty.
 *
 * @param value - The raw sheet name candidate.
 * @returns A valid Excel sheet name.
 */
export function sanitizeSheetName(value: string) {
  const cleaned = value
    .replace(/[\/*?:\[\]]/g, '')
    .trim()
    .slice(0, 31)
  return cleaned || 'Sheet'
}
