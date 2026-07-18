import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import ExcelJS from 'exceljs'
import { exercises } from '@gym-pilot/shared'
import { buildFavoritePlanBuilderState } from '../domain/planBuilderFavorites'
import { loadPlanBuilderFavoriteStorage } from '../services/planBuilderStorage'
import {
  resolvePlanBuilderHydrationState,
  resolvePlanBuilderLinkRows,
  resolvePlanBuilderRemoveTabState,
  resolvePlanBuilderResetState,
  resolvePlanBuilderRowState,
  resolvePlanBuilderTabState,
  type PlanBuilderTransitionState,
} from '../domain/planBuilderTransitions'
import {
  buildPlanSessionsFromTabs,
  sanitizeSheetName,
  type PlanTab,
} from '../../../utils/planBuilderUtils'
import type { PlanSession } from '@gym-pilot/types'

export type PlanBuilderFeatureState = {
  tabs: PlanTab[]
  activeTabId: string | null
  selectedExerciseId: string
  selectedExerciseName: string
  favoriteExerciseIds: string[]
  favoriteLinks: Array<{
    id: string
    label: string
    path: string
    folder?: string
  }>
  isFullscreen: boolean
  personNamesInput: string
}

export type PlanBuilderFeatureActions = {
  setSelectedExerciseId: (value: string) => void
  setSelectedExerciseName: (value: string) => void
  setPersonNamesInput: (value: string) => void
  setTabs: Dispatch<SetStateAction<PlanTab[]>>
  setActiveTabId: (value: string | null) => void
  setIsFullscreen: (value: boolean) => void
  handleAddTab: () => void
  handleRenameTab: (tabId: string, nextTitle: string) => void
  handleRemoveTab: (tabId: string) => void
  handleAddRow: (exerciseId?: string) => void
  handleExerciseSelection: (exerciseId: string, exerciseName: string) => void
  handleAddLinkRows: (links: Array<{ label: string; path: string }>) => void
  handleRemoveRow: (rowId: string) => void
  handleMoveRow: (rowId: string, direction: -1 | 1) => void
  handleCellChange: (rowId: string, field: string, value: string) => void
  handleExportToExcel: () => Promise<void>
  buildPlanSessions: () => PlanSession[]
  resetForCreate: () => void
  hydrateFromPlan: (
    plan:
      { planSessions?: PlanSession[]; planName?: string } | null | undefined,
  ) => void
}

export function createPlanBuilderInitialState(
  existingSessions?: PlanSession[] | null,
) {
  const initialState = resolvePlanBuilderHydrationState({
    planSessions: existingSessions ?? undefined,
    planName: '',
  })
  return {
    tabs: initialState.tabs,
    activeTabId: initialState.activeTabId,
    selectedExerciseId: initialState.selectedExerciseId,
    selectedExerciseName: initialState.selectedExerciseName,
    favoriteExerciseIds: [] as string[],
    favoriteLinks: [] as Array<{
      id: string
      label: string
      path: string
      folder?: string
    }>,
    isFullscreen: false,
    personNamesInput: initialState.personNamesInput,
  }
}

export function usePlanBuilderFeature(existingSessions?: PlanSession[] | null) {
  const initialState = useMemo(
    () => createPlanBuilderInitialState(existingSessions),
    [existingSessions],
  )
  const [tabs, setTabs] = useState<PlanTab[]>(initialState.tabs)
  const [activeTabId, setActiveTabId] = useState<string | null>(
    initialState.activeTabId,
  )
  const [selectedExerciseId, setSelectedExerciseId] = useState(
    initialState.selectedExerciseId,
  )
  const [selectedExerciseName, setSelectedExerciseName] = useState(
    initialState.selectedExerciseName,
  )
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<string[]>(
    initialState.favoriteExerciseIds,
  )
  const [favoriteLinks, setFavoriteLinks] = useState<
    Array<{ id: string; label: string; path: string; folder?: string }>
  >(initialState.favoriteLinks)
  const [isFullscreen, setIsFullscreen] = useState(initialState.isFullscreen)
  const [personNamesInput, setPersonNamesInput] = useState(
    initialState.personNamesInput,
  )

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [activeTabId, tabs],
  )
  const activeRows = activeTab?.rows ?? []

  const favoriteExercises = useMemo(() => {
    const selectedExerciseIds = new Set(
      activeRows.filter((row) => row.exerciseId).map((row) => row.exerciseId),
    )
    return exercises.filter(
      (exercise) =>
        favoriteExerciseIds.includes(exercise.id) &&
        !selectedExerciseIds.has(exercise.id),
    )
  }, [activeRows, favoriteExerciseIds])

  useEffect(() => {
    if (!activeTabId && tabs.length > 0) {
      setActiveTabId(tabs[0].id)
    }
  }, [activeTabId, tabs])

  useEffect(() => {
    let cancelled = false

    void loadPlanBuilderFavoriteStorage().then((storedValue) => {
      if (cancelled) {
        return
      }

      const state = buildFavoritePlanBuilderState(
        storedValue,
        activeRows,
        exercises,
      )
      setFavoriteExerciseIds(state.favoriteExerciseIds)
      setFavoriteLinks(state.favoriteLinks)
    })

    return () => {
      cancelled = true
    }
  }, [activeRows])

  useEffect(() => {
    if (!isFullscreen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const handleAddTab = useCallback(() => {
    const nextState = resolvePlanBuilderTabState(
      {
        tabs,
        activeTabId,
        selectedExerciseId,
        selectedExerciseName,
        personNamesInput,
      } as PlanBuilderTransitionState,
      `Day ${tabs.length + 1}`,
    )

    setTabs(nextState.tabs)
    setActiveTabId(nextState.activeTabId)
  }, [
    activeTabId,
    personNamesInput,
    selectedExerciseId,
    selectedExerciseName,
    tabs,
  ])

  const handleRenameTab = useCallback((tabId: string, nextTitle: string) => {
    const trimmedTitle = nextTitle.trim()

    setTabs((current) =>
      current.map((tab) =>
        tab.id === tabId
          ? { ...tab, title: trimmedTitle || 'Untitled tab' }
          : tab,
      ),
    )
  }, [])

  const handleRemoveTab = useCallback(
    (tabId: string) => {
      const nextState = resolvePlanBuilderRemoveTabState(
        {
          tabs,
          activeTabId,
          selectedExerciseId,
          selectedExerciseName,
          personNamesInput,
        } as PlanBuilderTransitionState,
        tabId,
      )

      setTabs(nextState.tabs)
      if (nextState.activeTabId !== activeTabId) {
        setActiveTabId(nextState.activeTabId)
      }
    },
    [
      activeTabId,
      personNamesInput,
      selectedExerciseId,
      selectedExerciseName,
      tabs,
    ],
  )

  const handleAddRow = useCallback(
    (exerciseId = selectedExerciseId) => {
      const nextState = resolvePlanBuilderRowState(
        {
          tabs,
          activeTabId,
          selectedExerciseId,
          selectedExerciseName,
          personNamesInput,
        } as PlanBuilderTransitionState,
        exerciseId,
      )

      if (!nextState) {
        return
      }

      setTabs(nextState.tabs)
      setSelectedExerciseId(nextState.selectedExerciseId)
      setSelectedExerciseName(nextState.selectedExerciseName)
    },
    [
      activeTabId,
      personNamesInput,
      selectedExerciseId,
      selectedExerciseName,
      tabs,
    ],
  )

  const handleExerciseSelection = useCallback(
    (exerciseId: string, exerciseName: string) => {
      setSelectedExerciseId(exerciseId)
      setSelectedExerciseName(exerciseName)
    },
    [],
  )

  const handleAddLinkRows = useCallback(
    (links: Array<{ label: string; path: string }>) => {
      if (!activeTabId) {
        return
      }

      const normalizedRows = resolvePlanBuilderLinkRows(links, activeTabId)

      if (normalizedRows.length === 0) {
        return
      }

      setTabs((current) =>
        current.map((tab) => {
          if (tab.id !== activeTabId) {
            return tab
          }

          return {
            ...tab,
            rows: [...tab.rows, ...normalizedRows],
          }
        }),
      )
    },
    [activeTabId],
  )

  const handleRemoveRow = useCallback(
    (rowId: string) => {
      if (!activeTabId) {
        return
      }

      setTabs((current) =>
        current.map((tab) =>
          tab.id === activeTabId
            ? { ...tab, rows: tab.rows.filter((row) => row.id !== rowId) }
            : tab,
        ),
      )
    },
    [activeTabId],
  )

  const handleMoveRow = useCallback(
    (rowId: string, direction: -1 | 1) => {
      if (!activeTabId) {
        return
      }

      setTabs((current) =>
        current.map((tab) => {
          if (tab.id !== activeTabId) {
            return tab
          }

          const index = tab.rows.findIndex((row) => row.id === rowId)

          if (index < 0) {
            return tab
          }

          const nextIndex = index + direction

          if (nextIndex < 0 || nextIndex >= tab.rows.length) {
            return tab
          }

          const updatedRows = [...tab.rows]
          const [rowToMove] = updatedRows.splice(index, 1)
          updatedRows.splice(nextIndex, 0, rowToMove)

          return { ...tab, rows: updatedRows }
        }),
      )
    },
    [activeTabId],
  )

  const handleCellChange = useCallback(
    (rowId: string, field: string, value: string) => {
      if (!activeTabId) {
        return
      }

      setTabs((current) =>
        current.map((tab) =>
          tab.id === activeTabId
            ? {
                ...tab,
                rows: tab.rows.map((row) =>
                  row.id === rowId ? { ...row, [field]: value } : row,
                ),
              }
            : tab,
        ),
      )
    },
    [activeTabId],
  )

  const handleExportToExcel = useCallback(async () => {
    if (typeof window === 'undefined') {
      return
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'GymPilot'
    workbook.lastModifiedBy = 'GymPilot'
    workbook.created = new Date()
    workbook.modified = new Date()

    const exportName =
      (personNamesInput.trim() || 'plan')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/(^-|-$)/g, '') || 'plan'

    tabs.forEach((tab, index) => {
      const worksheet = workbook.addWorksheet(
        sanitizeSheetName(tab.title || `Day ${index + 1}`),
      )
      worksheet.columns = [
        { header: 'Exercise', key: 'exercise', width: 32 },
        { header: 'Reps', key: 'reps', width: 14 },
        { header: 'Working sets', key: 'workingSets', width: 16 },
        { header: 'Notes', key: 'notes', width: 36 },
      ]

      tab.rows.forEach((row) => {
        const exercise = exercises.find((item) => item.id === row.exerciseId)
        worksheet.addRow({
          exercise: exercise?.name ?? '',
          reps: row.reps,
          workingSets: row.workingSets,
          notes: row.notes,
        })
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument/spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${exportName}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }, [personNamesInput, tabs])

  const buildPlanSessions = useCallback(
    () => buildPlanSessionsFromTabs(tabs),
    [tabs],
  )

  const resetForCreate = useCallback(() => {
    const nextState = resolvePlanBuilderResetState()
    setPersonNamesInput(nextState.personNamesInput)
    setSelectedExerciseId(nextState.selectedExerciseId)
    setSelectedExerciseName(nextState.selectedExerciseName)
    setTabs(nextState.tabs)
    setActiveTabId(nextState.activeTabId)
  }, [])

  const hydrateFromPlan = useCallback(
    (
      plan:
        { planSessions?: PlanSession[]; planName?: string } | null | undefined,
    ) => {
      const nextState = resolvePlanBuilderHydrationState(plan)
      setPersonNamesInput(nextState.personNamesInput)
      setSelectedExerciseId(nextState.selectedExerciseId)
      setSelectedExerciseName(nextState.selectedExerciseName)
      setTabs(nextState.tabs)
      setActiveTabId(nextState.activeTabId)
    },
    [],
  )

  return {
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    selectedExerciseId,
    setSelectedExerciseId,
    selectedExerciseName,
    setSelectedExerciseName,
    favoriteExerciseIds,
    favoriteLinks,
    isFullscreen,
    setIsFullscreen,
    personNamesInput,
    setPersonNamesInput,
    favoriteExercises,
    activeRows,
    handleAddTab,
    handleRenameTab,
    handleRemoveTab,
    handleAddRow,
    handleExerciseSelection,
    handleAddLinkRows,
    handleRemoveRow,
    handleMoveRow,
    handleCellChange,
    handleExportToExcel,
    buildPlanSessions,
    resetForCreate,
    hydrateFromPlan,
  }
}
