import { useEffect, useMemo, useState } from 'react'
import ExcelJS from 'exceljs'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { getToneClass } from '../components/toneClasses'
import { exercises, usePlan } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'
import { ExerciseSearchPicker } from '../components/ExerciseSearchPicker'
import { QUICK_LINKS_FAVORITES_STORAGE_KEY } from '../constants/storageKeys'
import { getExercisePath } from '../utils/exerciseRouteUtils'
import { formatLabel } from '../utils/formatUtils'

ModuleRegistry.registerModules([AllCommunityModule])

interface PlanGridRow {
  id: string
  exerciseId: string
  reps: string
  workingSets: string
  notes: string
  [key: string]: string | undefined
}

interface PlanTab {
  id: string
  title: string
  rows: PlanGridRow[]
}

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

function createBlankRow(exerciseId = ''): PlanGridRow {
  return {
    id: createId(),
    exerciseId,
    reps: '',
    workingSets: '',
    notes: '',
  }
}

function createBlankTab(title: string): PlanTab {
  return {
    id: createId(),
    title,
    rows: [],
  }
}

function sanitizeSheetName(value: string) {
  const cleaned = value.replace(/[\\/*?:\[\]]/g, '').trim().slice(0, 31)
  return cleaned || 'Sheet'
}

export function CreatePlanPage() {
  const { createPlan, plans, updatePlan } = usePlan()
  const navigate = useNavigate()
  const { planSlug } = useParams()
  const planToEdit = useMemo(() => plans.find((item) => item.planSlug === planSlug), [plans, planSlug])
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

  const favoriteExercises = useMemo(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const raw = window.localStorage.getItem(QUICK_LINKS_FAVORITES_STORAGE_KEY)

      if (!raw) {
        return []
      }

      const parsed = JSON.parse(raw) as Array<{ label?: string; path?: string }>
      const favoritePaths = new Set(parsed.filter((item) => typeof item?.path === 'string').map((item) => item.path))
      const selectedExerciseIds = new Set(activeRows.filter((row) => row.exerciseId).map((row) => row.exerciseId))

      return exercises.filter((exercise) => favoritePaths.has(getExercisePath(exercise)) && !selectedExerciseIds.has(exercise.id))
    } catch {
      return []
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
    const nextTab = createBlankTab('Day 1')
    nextTab.rows = planToEdit.exercises.map((exercise) => createBlankRow(exercise.id))
    setTabs([nextTab])
    setActiveTabId(nextTab.id)
  }, [planToEdit])

  const handleAssignPlan = () => {
    const selectedExerciseIds = tabs.flatMap((tab) => tab.rows.filter((row) => row.exerciseId).map((row) => row.exerciseId))

    if (selectedExerciseIds.length === 0) {
      return
    }

    const planName = personNamesInput.trim() || 'Untitled plan'

    if (isEditMode && planToEdit) {
      updatePlan(planToEdit.id, planName, selectedExerciseIds)
      navigate(`/plans/${planToEdit.planSlug}`)
      return
    }

    createPlan(planName, selectedExerciseIds)
    setPersonNamesInput('')
    const resetTab = createBlankTab('Day 1')
    setTabs([resetTab])
    setActiveTabId(resetTab.id)
    navigate('/plans')
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

  const columnDefs = useMemo<ColDef<PlanGridRow>[]>(() => {
    const defs: ColDef<PlanGridRow>[] = [
      {
        headerName: 'Exercise',
        field: 'exerciseId',
        editable: false,
        flex: 2,
        minWidth: 220,
        cellClass: 'ag-cell-padding',
        valueFormatter: (params) => {
          const exercise = exercises.find((item) => item.id === params.value)
          return exercise?.name ?? ''
        },
        onCellValueChanged: (params) => {
          handleCellChange(params.data?.id ?? '', 'exerciseId', params.newValue as string)
        },
        cellStyle: {
          fontSize: '0.95rem',
          paddingTop: '0.7rem',
          paddingBottom: '0.7rem',
        },
      },
      {
        headerName: 'Reps',
        field: 'reps',
        editable: true,
        flex: 1,
        minWidth: 120,
        onCellValueChanged: (params) => {
          handleCellChange(params.data?.id ?? '', 'reps', params.newValue as string)
        },
        cellStyle: {
          fontSize: '0.95rem',
          paddingTop: '0.7rem',
          paddingBottom: '0.7rem',
        },
      },
      {
        headerName: 'Working sets',
        field: 'workingSets',
        editable: true,
        flex: 1,
        minWidth: 120,
        onCellValueChanged: (params) => {
          handleCellChange(params.data?.id ?? '', 'workingSets', params.newValue as string)
        },
        cellStyle: {
          fontSize: '0.95rem',
          paddingTop: '0.7rem',
          paddingBottom: '0.7rem',
        },
      },
      {
        headerName: 'Notes',
        field: 'notes',
        editable: true,
        flex: 1,
        minWidth: 180,
        onCellValueChanged: (params) => {
          handleCellChange(params.data?.id ?? '', 'notes', params.newValue as string)
        },
        cellStyle: {
          fontSize: '0.95rem',
          paddingTop: '0.7rem',
          paddingBottom: '0.7rem',
        },
      },
    ]

    if (isFullscreen) {
      defs.push({
        headerName: 'Actions',
        field: 'id',
        sortable: false,
        flex: 1,
        minWidth: 160,
        cellRenderer: (params: { data: PlanGridRow; node?: { rowIndex?: number | null } }) => {
          const row = params.data
          const rowIndex = params.node?.rowIndex
          const isFirstRow = typeof rowIndex === 'number' && rowIndex <= 0
          const isLastRow = typeof rowIndex === 'number' && rowIndex >= activeRows.length - 1

          return (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleMoveRow(row.id, -1)}
                disabled={isFirstRow}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.95rem] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Move row up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => handleMoveRow(row.id, 1)}
                disabled={isLastRow}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.95rem] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Move row down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => handleRemoveRow(row.id)}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.95rem] font-medium text-emerald-700 hover:bg-emerald-100"
              >
                Remove
              </button>
            </div>
          )
        },
      })
    }

    return defs
  }, [activeRows.length, isFullscreen])

  return (
    <PageLayout>
      <PageCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Paragraph>Plans</Paragraph>
            <Heading1 className="mt-2">{isEditMode ? 'Edit plan' : 'Create a new plan'}</Heading1>
          </div>
          <Link to="/plans" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
            Back to plans
          </Link>
        </div>

        <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button tone="blue" onClick={handleExportToExcel} className="px-4 py-2">
                    Export Excel
                  </Button>
                  {!isFullscreen ? (
                    <Button tone="default" onClick={() => setIsFullscreen(true)} className="px-4 py-2">
                      Full screen
                    </Button>
                  ) : null}
                </div>
              </div>

              <p className="text-sm text-slate-600">Each tab is exported as a separate worksheet in a single workbook.</p>

              {!isFullscreen ? (
                <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-72 flex-1">
                      <ExerciseSearchPicker
                        id="plan-exercise-search"
                        label="Exercise"
                        value={selectedExerciseName}
                        placeholder="Search exercises"
                        onChange={(nextValue) => {
                          setSelectedExerciseName(nextValue)
                          if (!nextValue.trim()) {
                            setSelectedExerciseId('')
                          }
                        }}
                        onSelectExercise={(exercise) => {
                          handleExerciseSelection(exercise.id, exercise.name)
                        }}
                      />
                    </div>
                    <Button tone="emerald" onClick={() => handleAddRow(selectedExerciseId)} className="px-4 py-2">
                      Add row
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className={isFullscreen ? 'fixed inset-3 z-50 flex flex-col overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-2xl' : 'overflow-hidden rounded-2xl border border-slate-200 bg-white'}>
                {isFullscreen ? (
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="min-w-72 flex-1">
                        <ExerciseSearchPicker
                          id="plan-exercise-search-fullscreen"
                          label="Exercise"
                          value={selectedExerciseName}
                          placeholder="Search exercises"
                          onChange={(nextValue) => {
                            setSelectedExerciseName(nextValue)
                            if (!nextValue.trim()) {
                              setSelectedExerciseId('')
                            }
                          }}
                          onSelectExercise={(exercise) => {
                            handleExerciseSelection(exercise.id, exercise.name)
                          }}
                        />
                      </div>
                      <Button tone="emerald" onClick={() => handleAddRow(selectedExerciseId)} className="px-4 py-2">
                        Add row
                      </Button>
                    </div>
                    <Button tone="default" onClick={() => setIsFullscreen(false)} className="px-4 py-2">
                      Exit full screen
                    </Button>
                  </div>
                ) : null}

                {favoriteExercises.length > 0 ? (
                  <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-3 py-3">
                    <span className="self-center text-sm font-medium text-slate-600">From favourites</span>
                    {favoriteExercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => handleAddRow(exercise.id)}
                        className="cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium"
                      >
                        {formatLabel(exercise.name)}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-3">
                  {tabs.map((tab) => (
                    <div
                      key={tab.id}
                      className={`flex items-center rounded-full border px-2 py-1.5 ${activeTab?.id === tab.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}`}
                    >
                      <input
                        type="text"
                        value={tab.title}
                        onChange={(event) => handleRenameTab(tab.id, event.target.value)}
                        onFocus={() => setActiveTabId(tab.id)}
                        onClick={() => setActiveTabId(tab.id)}
                        aria-label={`Rename tab ${tab.title}`}
                        className="w-24 bg-transparent text-sm font-medium outline-none"
                        placeholder="Tab name"
                      />
                      {tabs.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveTab(tab.id)}
                          className="ml-1 rounded-full px-1 text-sm leading-none text-slate-500 hover:text-slate-700"
                          aria-label={`Remove tab ${tab.title}`}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <Button tone="default" onClick={handleAddTab} className="px-3 py-2">
                    + Add tab
                  </Button>
                </div>

                <div className={`ag-theme-quartz ${isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-105'} w-full`}>
                  <AgGridReact<PlanGridRow>
                    key={activeTab?.id}
                    rowData={activeRows}
                    columnDefs={columnDefs}
                    defaultColDef={{ resizable: true, editable: true }}
                    domLayout="autoHeight"
                    rowHeight={56}
                    headerHeight={44}
                    animateRows={true}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <input
                  type="text"
                  value={personNamesInput}
                  onChange={(event) => setPersonNamesInput(event.target.value)}
                  placeholder="Plan name"
                  className="min-w-56 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                />
                <Button tone="emerald" onClick={handleAssignPlan} className="px-4 py-2">
                  {isEditMode ? 'Save changes' : 'Create plan'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageCard>
    </PageLayout>
  )
}
