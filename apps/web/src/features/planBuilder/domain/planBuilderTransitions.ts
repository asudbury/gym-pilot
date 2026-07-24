import { exercises } from '@gym-pilot/shared'
import {
  createBlankRow,
  createBlankTab,
  createLinkRow,
  type PlanTab,
} from '../../../utils/planBuilderUtils'
import type { PlanSession } from '@gym-pilot/types'
import { buildTabsFromSessions } from '../../../utils/planBuilderUtils'

export type PlanBuilderTransitionState = {
  tabs: PlanTab[]
  activeTabId: string | null
  selectedExerciseId?: string
  selectedExerciseName?: string
  personNamesInput?: string
}

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
