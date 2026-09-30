import { exercises } from '@gym-pilot/shared'
import type { PlanSession } from '@gym-pilot/types'
import {
  buildTabsFromSessions,
  createBlankRow,
  createBlankTab,
  createLinkRow,
  type PlanTab,
} from './planBuilderUtils'

export type PlanBuilderTransitionState = {
  tabs: PlanTab[]
  activeTabId: string | null
  selectedExerciseId?: string
  selectedExerciseName?: string
  personNamesInput?: string
}

/**
 * Returns the next state after adding a new tab with the given title.
 * The new tab becomes the active tab.
 *
 * @param currentState - The current plan builder state.
 * @param title - The title for the new tab.
 */
export function resolvePlanBuilderTabState(
  currentState: PlanBuilderTransitionState,
  title: string,
) {
  const nextTab = createBlankTab(title)

  return {
    tabs: [...currentState.tabs, nextTab],
    activeTabId: nextTab.id,
  }
}

/**
 * Returns the next state after removing a tab by ID.
 * Prevents removing the last remaining tab.
 * If the removed tab was active, the first remaining tab becomes active.
 *
 * @param currentState - The current plan builder state.
 * @param tabId - The ID of the tab to remove.
 */
export function resolvePlanBuilderRemoveTabState(
  currentState: PlanBuilderTransitionState,
  tabId: string,
) {
  if (currentState.tabs.length <= 1) {
    return currentState
  }

  const nextTabs = currentState.tabs.filter((tab) => tab.id !== tabId)
  const removedTabWasActive = currentState.activeTabId === tabId

  return {
    tabs: nextTabs,
    activeTabId: removedTabWasActive
      ? (nextTabs[0]?.id ?? null)
      : currentState.activeTabId,
  }
}

/**
 * Returns the next state after appending an exercise row to the active tab.
 * Returns null when there is no active tab or exerciseId is empty.
 *
 * @param currentState - The current plan builder state.
 * @param exerciseId - The exercise to add as a new row.
 */
export function resolvePlanBuilderRowState(
  currentState: PlanBuilderTransitionState,
  exerciseId: string,
) {
  if (!exerciseId || !currentState.activeTabId) {
    return null
  }

  return {
    tabs: currentState.tabs.map((tab) =>
      tab.id === currentState.activeTabId
        ? { ...tab, rows: [...tab.rows, createBlankRow(exerciseId)] }
        : tab,
    ),
    selectedExerciseId: '',
    selectedExerciseName: '',
  }
}

/**
 * Converts a set of navigation links into link rows for the active tab.
 * Filters out links with empty label or path. Returns an empty array when
 * there is no active tab.
 *
 * @param links - Navigation links to add.
 * @param activeTabId - The ID of the currently active tab.
 */
export function resolvePlanBuilderLinkRows(
  links: Array<{ label: string; path: string }>,
  activeTabId: string | null,
) {
  if (!activeTabId) {
    return []
  }

  const normalizedLinks = links
    .map((link) => ({ label: link.label.trim(), path: link.path.trim() }))
    .filter((link) => link.label && link.path)

  return normalizedLinks.map((link) => createLinkRow(link.label, link.path))
}

/**
 * Returns the complete reset state for the plan builder.
 * Creates a single blank "Day 1" tab and clears all other fields.
 * Uses the first available exercise as the default selection.
 */
export function resolvePlanBuilderResetState() {
  const resetTab = createBlankTab('Day 1')

  return {
    tabs: [resetTab],
    activeTabId: resetTab.id,
    selectedExerciseId: exercises[0]?.id ?? '',
    selectedExerciseName: '',
    personNamesInput: '',
  }
}

/**
 * Returns the hydrated state from an existing plan, populating tabs from
 * saved plan sessions and setting the first tab as active.
 * Clears selection and person name fields.
 *
 * @param plan - The plan to hydrate from. Accepts null/undefined for a blank state.
 */
export function resolvePlanBuilderHydrationState(
  plan: { planSessions?: PlanSession[]; planName?: string } | null | undefined,
) {
  const nextTabs = buildTabsFromSessions(plan?.planSessions)

  return {
    tabs: nextTabs,
    activeTabId: nextTabs[0]?.id ?? null,
    selectedExerciseId: '',
    selectedExerciseName: '',
    personNamesInput: plan?.planName ?? '',
  }
}
