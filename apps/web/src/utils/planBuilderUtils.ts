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

export function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`
}

export function createBlankRow(exerciseId = ''): PlanGridRow {
  return {
    id: createId(),
    exerciseId,
    reps: '',
    workingSets: '',
    notes: '',
  }
}

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

export function createBlankTab(title: string): PlanTab {
  return {
    id: createId(),
    title,
    rows: [],
  }
}

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

export function sanitizeSheetName(value: string) {
  const cleaned = value
    .replace(/[\\/*?:\[\]]/g, '')
    .trim()
    .slice(0, 31)
  return cleaned || 'Sheet'
}
