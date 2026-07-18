import { useEffect, useMemo, useState } from 'react'
import ExcelJS from 'exceljs'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getToneClass } from '../../components/toneClasses'
import { exercises, loadJsonRecord, usePlan } from '@gym-pilot/shared'
import { PageCard } from '../../components/PageCard'
import { PageLayout } from '../../layouts/PageLayout'
import { Heading1, Paragraph } from '../../components/Typography'
import { FAVORITES_KEY } from '../../constants/storageKeys'
import { getExercisePath } from '../../utils/exerciseRouteUtils'
import { PlanBuilderWorkspace } from '../../components/PlanBuilderWorkspace'
import {
  buildPlanSessionsFromTabs,
  buildTabsFromSessions,
  createBlankRow,
  createBlankTab,
  createLinkRow,
  sanitizeSheetName,
  type PlanTab,
} from '../../utils/planBuilderUtils'

export function CreatePlanPage() {
  const { createPlan, plans, updatePlan } = usePlan()
  const navigate = useNavigate()
  const location = useLocation()
  const { planSlug } = useParams()
  const planToEdit = useMemo(() => plans.find((item) => item.planSlug === planSlug), [plans, planSlug])
  const isAssignmentRoute = location.pathname.includes('/assignments/')
  const isEditMode = Boolean(planToEdit)
  const [personNamesInput, setPersonNamesInput] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState(exercises[0]?.id ?? '')
  const [selectedExerciseName, setSelectedExerciseName] = useState('')
  const [tabs, setTabs] = useState<PlanTab[]>(() => [createBlankTab('Day 1')])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0], [activeTabId, tabs])
  const activeRows = activeTab?.rows ?? []

  useEffect(() => {
    if (!activeTabId && tabs.length > 0) {
      setActiveTabId(tabs[0].id)
    }
  }, [activeTabId, tabs])

  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<string[]>([])
  const [favoriteLinks, setFavoriteLinks] = useState<Array<{ id: string; label: string; path: string; folder?: string }>>([])

  const favoriteExercises = useMemo(() => {
    const selectedExerciseIds = new Set(activeRows.filter((row) => row.exerciseId).map((row) => row.exerciseId))

    return exercises.filter((exercise) => favoriteExerciseIds.includes(exercise.id) && !selectedExerciseIds.has(exercise.id))
  }, [activeRows, favoriteExerciseIds])

  useEffect(() => {
    let isActive = true

    void loadJsonRecord<unknown>(FAVORITES_KEY, { favorites: [], folders: [] }).then((storedValue) => {
      if (!isActive) {
        return
      }

      const normalizedValue = storedValue && typeof storedValue === 'object'
        ? storedValue as { favorites?: Array<{ id?: string; label?: string; path?: string; folder?: string }>; folders?: string[] }
        : { favorites: [] as Array<{ id?: string; label?: string; path?: string; folder?: string }>, folders: [] as string[] }

      const storedFavorites = Array.isArray(normalizedValue.favorites)
        ? normalizedValue.favorites.filter((item): item is { id?: string; label?: string; path?: string; folder?: string } => Boolean(item && typeof item === 'object' && typeof item.path === 'string' && typeof item.label === 'string'))
        : []

      const favoritePaths = new Set(storedFavorites.filter((item) => typeof item?.path === 'string').map((item) => item.path))
      const selectedExerciseIds = new Set(activeRows.filter((row) => row.exerciseId).map((row) => row.exerciseId))

      const ids = exercises
        .filter((exercise) => favoritePaths.has(getExercisePath(exercise)) && !selectedExerciseIds.has(exercise.id))
        .map((exercise) => exercise.id)

      setFavoriteExerciseIds(ids)
      setFavoriteLinks(
        storedFavorites
          .filter((item): item is { id?: string; label: string; path: string; folder?: string } => typeof item?.path === 'string' && typeof item?.label === 'string')
          .map((item) => ({
            id: item.id || `${item.label}-${item.path}`,
            label: item.label,
            path: item.path,
            folder: item.folder,
          })),
      )
    })

    return () => {
      isActive = false
    }
  }, [activeRows])

  useEffect(() => {
    if (!planToEdit) {
      setPersonNamesInput('')
      setSelectedExerciseId(exercises[0]?.id ?? '')
      setSelectedExerciseName('')
      const fallbackTab = createBlankTab('Day 1')
      setTabs([fallbackTab])
      setActiveTabId(fallbackTab.id)
      return
    }

    setPersonNamesInput(planToEdit.planName)
    setSelectedExerciseId('')
    setSelectedExerciseName('')
    const nextTabs = buildTabsFromSessions(planToEdit.planSessions)
    setTabs(nextTabs)
    setActiveTabId(nextTabs[0]?.id ?? null)
  }, [planToEdit])

  const handleAssignPlan = () => {
    const planSessions = buildPlanSessionsFromTabs(tabs)

    if (!planSessions.some((session) => session.planItems.length > 0)) {
      return
    }

    const planName = personNamesInput.trim() || 'Untitled plan'

    if (isEditMode && planToEdit) {
      updatePlan(planToEdit.id, planName, planSessions)
      navigate(isAssignmentRoute ? '/users' : `/plans/${planToEdit.planSlug}`)
      return
    }

    createPlan(planName, planSessions)
    setPersonNamesInput('')
    const resetTab = createBlankTab('Day 1')
    setTabs([resetTab])
    setActiveTabId(resetTab.id)
    navigate(isAssignmentRoute ? '/users' : '/plans')
  }

  const handleAddTab = () => {
    const nextTab = createBlankTab(`Day ${tabs.length + 1}`)
    setTabs((current) => [...current, nextTab])
    setActiveTabId(nextTab.id)
  }

  const handleRenameTab = (tabId: string, nextTitle: string) => {
    const trimmedTitle = nextTitle.trim()

    setTabs((current) =>
      current.map((tab) => (tab.id === tabId ? { ...tab, title: trimmedTitle || 'Untitled tab' } : tab)),
    )
  }

  const handleRemoveTab = (tabId: string) => {
    setTabs((current) => {
      if (current.length <= 1) {
        return current
      }

      const nextTabs = current.filter((tab) => tab.id !== tabId)
      const removedTabWasActive = activeTabId === tabId

      if (!removedTabWasActive) {
        return nextTabs
      }

      const nextActiveTab = nextTabs[0]
      setActiveTabId(nextActiveTab?.id ?? null)
      return nextTabs
    })
  }

  const handleAddRow = (exerciseId = selectedExerciseId) => {
    if (!exerciseId || !activeTabId) {
      return
    }

    setTabs((current) => current.map((tab) => (tab.id === activeTabId ? { ...tab, rows: [...tab.rows, createBlankRow(exerciseId)] } : tab)))
    setSelectedExerciseId('')
    setSelectedExerciseName('')
  }

  const handleExerciseSelection = (exerciseId: string, exerciseName: string) => {
    setSelectedExerciseId(exerciseId)
    setSelectedExerciseName(exerciseName)
  }

  const handleAddLinkRows = (links: Array<{ label: string; path: string }>) => {
    if (!activeTabId) {
      return
    }

    const normalizedLinks = links
      .map((link) => ({ label: link.label.trim(), path: link.path.trim() }))
      .filter((link) => link.label && link.path)

    if (normalizedLinks.length === 0) {
      return
    }

    setTabs((current) =>
      current.map((tab) => {
        if (tab.id !== activeTabId) {
          return tab
        }

        return {
          ...tab,
          rows: [...tab.rows, ...normalizedLinks.map((link) => createLinkRow(link.label, link.path))],
        }
      }),
    )
  }

  const handleRemoveRow = (rowId: string) => {
    if (!activeTabId) {
      return
    }

    setTabs((current) => current.map((tab) => (tab.id === activeTabId ? { ...tab, rows: tab.rows.filter((row) => row.id !== rowId) } : tab)))
  }

  const handleMoveRow = (rowId: string, direction: -1 | 1) => {
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
  }

  const handleCellChange = (rowId: string, field: string, value: string) => {
    if (!activeTabId) {
      return
    }

    setTabs((current) => current.map((tab) => (tab.id === activeTabId ? { ...tab, rows: tab.rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)) } : tab)))
  }

  const handleExportToExcel = async () => {
    if (typeof window === 'undefined') {
      return
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'GymPilot'
    workbook.lastModifiedBy = 'GymPilot'
    workbook.created = new Date()
    workbook.modified = new Date()

    const exportName = (personNamesInput.trim() || 'plan').replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'plan'

    tabs.forEach((tab, index) => {
      const worksheet = workbook.addWorksheet(sanitizeSheetName(tab.title || `Day ${index + 1}`))
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
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${exportName}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

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

  return (
    <PageLayout>
      <PageCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Paragraph>Plans</Paragraph>
            <Heading1 className="mt-2">{isAssignmentRoute ? (isEditMode ? 'Edit assignment' : 'Create a new assignment') : (isEditMode ? 'Edit plan' : 'Create a new plan')}</Heading1>
          </div>
          <Link to="/plans" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
            Back to plans
          </Link>
        </div>

        <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:mt-6 sm:space-y-6 sm:p-4">
          <PlanBuilderWorkspace
            tabs={tabs}
            activeTabId={activeTabId}
            activeRows={activeRows}
            favoriteExercises={favoriteExercises}
            selectedExerciseName={selectedExerciseName}
            selectedExerciseId={selectedExerciseId}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen((current) => !current)}
            onExportToExcel={handleExportToExcel}
            onExerciseSelection={handleExerciseSelection}
            favoriteLinks={favoriteLinks}
            onAddLinkRows={handleAddLinkRows}
            onSearchChange={(nextValue) => {
              setSelectedExerciseName(nextValue)
              if (!nextValue.trim()) {
                setSelectedExerciseId('')
              }
            }}
            onActivateTab={setActiveTabId}
            onAddRow={handleAddRow}
            onAddTab={handleAddTab}
            onRenameTab={handleRenameTab}
            onRemoveTab={handleRemoveTab}
            onMoveRow={handleMoveRow}
            onRemoveRow={handleRemoveRow}
            onCellChange={handleCellChange}
            planNameValue={personNamesInput}
            onPlanNameChange={setPersonNamesInput}
            showPlanNameInput
            planNamePlaceholder="Plan name"
            onSave={handleAssignPlan}
            saveLabel={isAssignmentRoute ? (isEditMode ? 'Save assignment' : 'Create assignment') : (isEditMode ? 'Save changes' : 'Create plan')}
          />
        </div>
      </PageCard>
    </PageLayout>
  )
}
