import { useEffect, useMemo, useState } from 'react'
import ExcelJS from 'exceljs'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
  sanitizeSheetName,
  type PlanTab,
} from '../../utils/planBuilderUtils'

export function CreateAssignmentPage() {
  const { assignments, visiblePlans, visibleUsers, updateAssignment, assignUsersToPlan } = usePlan()
  const navigate = useNavigate()
  const { planSlug } = useParams()
  const assignmentToEdit = useMemo(() => assignments.find((item) => item.id === planSlug), [assignments, planSlug])
  const isEditMode = Boolean(assignmentToEdit)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState(exercises[0]?.id ?? '')
  const [selectedExerciseName, setSelectedExerciseName] = useState('')
  const [tabs, setTabs] = useState<PlanTab[]>(() => [createBlankTab('Day 1')])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0], [activeTabId, tabs])
  const activeRows = activeTab?.rows ?? []
  const sourcePlans = useMemo(() => visiblePlans, [visiblePlans])
 
  useEffect(() => {
    if (!activeTabId && tabs.length > 0) {
      setActiveTabId(tabs[0].id)
    }
  }, [activeTabId, tabs])

  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<string[]>([])

  const favoriteExercises = useMemo(() => {
    const selectedExerciseIds = new Set(activeRows.filter((row) => row.exerciseId).map((row) => row.exerciseId))

    return exercises.filter((exercise) => favoriteExerciseIds.includes(exercise.id) && !selectedExerciseIds.has(exercise.id))
  }, [activeRows, favoriteExerciseIds])

  useEffect(() => {
    let isActive = true

    void loadJsonRecord<Array<{ path?: string }>>(FAVORITES_KEY, []).then((storedFavorites) => {
      if (!isActive) {
        return
      }

      const favoritePaths = new Set((storedFavorites ?? []).filter((item) => typeof item?.path === 'string').map((item) => item.path))
      const selectedExerciseIds = new Set(activeRows.filter((row) => row.exerciseId).map((row) => row.exerciseId))

      const ids = exercises
        .filter((exercise) => favoritePaths.has(getExercisePath(exercise)) && !selectedExerciseIds.has(exercise.id))
        .map((exercise) => exercise.id)

      setFavoriteExerciseIds(ids)
    })

    return () => {
      isActive = false
    }
  }, [activeRows])

  useEffect(() => {
    if (!assignmentToEdit) {
      setSelectedExerciseId(exercises[0]?.id ?? '')
      setSelectedExerciseName('')
      const fallbackTab = createBlankTab('Day 1')
      setTabs([fallbackTab])
      setActiveTabId(fallbackTab.id)
      return
    }

    setSelectedExerciseId('')
    setSelectedExerciseName('')
    const nextTabs = buildTabsFromSessions(assignmentToEdit.planSessions)
    setTabs(nextTabs)
    setActiveTabId(nextTabs[0]?.id ?? null)
  }, [assignmentToEdit])

  const handleSaveAssignment = () => {
    if (isEditMode && assignmentToEdit) {
      const planSessions = buildPlanSessionsFromTabs(tabs)

      if (!planSessions.some((session) => session.planItems.length > 0)) {
        return
      }

      updateAssignment(assignmentToEdit.id, assignmentToEdit.id, planSessions)
      navigate(`/users/${assignmentToEdit.assignedUserId ?? 'user'}/assignments/${assignmentToEdit.id}`)
      return
    }

    if (!selectedPlanId || !selectedUserId) {
      return
    }

    assignUsersToPlan(selectedPlanId, [selectedUserId])
    navigate(`/users/${selectedUserId}/assignments`)
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
    workbook.creator = 'Gym Pilot'
    workbook.lastModifiedBy = 'Gym Pilot'
    workbook.created = new Date()
    workbook.modified = new Date()

    const exportName = (assignmentToEdit?.id || 'assignment').replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'assignment'

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
            <Paragraph>Assignments</Paragraph>
            <Heading1 className="mt-2">{isEditMode ? 'Edit assignment' : 'Create a new assignment'}</Heading1>
          </div>
          <Link to="/assignments" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
            Back to assignments
          </Link>
        </div>

        <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:mt-6 sm:space-y-6 sm:p-4">
          {!isEditMode ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">User</span>
                  <select
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
                  >
                    <option value="">Select a user</option>
                    {visibleUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Base plan</span>
                  <select
                    value={selectedPlanId}
                    onChange={(event) => setSelectedPlanId(event.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700"
                  >
                    <option value="">Select a base plan</option>
                    {sourcePlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.planName || 'Untitled plan'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ) : null}

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
            onSave={handleSaveAssignment}
            saveLabel={isEditMode ? 'Save assignment' : 'Create assignment'}
            saveDisabled={isEditMode ? !assignmentToEdit : !selectedPlanId || !selectedUserId}
          />
        </div>
      </PageCard>
    </PageLayout>
  )
}
