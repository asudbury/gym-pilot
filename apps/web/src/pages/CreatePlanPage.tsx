import { useMemo, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { getToneClass } from '../components/toneClasses'
import { exercises, usePlan } from '@gym-pilot/shared'
import { PageCard } from '../components/PageCard'
import { PageLayout } from '../layouts/PageLayout'
import { Heading1, Paragraph } from '../components/Typography'

ModuleRegistry.registerModules([AllCommunityModule])

interface PlanGridRow {
  id: string
  exerciseId: string
  reps: string
  workingSets: string
  notes: string
  [key: string]: string | undefined
}

function createBlankRow(exerciseId = ''): PlanGridRow {
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    exerciseId,
    reps: '',
    workingSets: '',
    notes: '',
  }
}

export function CreatePlanPage() {
  const { createPlan } = usePlan()
  const navigate = useNavigate()
  const [personNamesInput, setPersonNamesInput] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState(exercises[0]?.id ?? '')
  const [rows, setRows] = useState<PlanGridRow[]>([createBlankRow(selectedExerciseId)])

  const handleAssignPlan = () => {
    const selectedExerciseIds = rows.filter((row) => row.exerciseId).map((row) => row.exerciseId)

    if (selectedExerciseIds.length === 0) {
      return
    }

    const planName = personNamesInput.trim() || 'Untitled plan'

    createPlan(planName, selectedExerciseIds)
    setPersonNamesInput('')
    setRows([createBlankRow(selectedExerciseId)])
    navigate('/plans')
  }

  const handleAddRow = (exerciseId = selectedExerciseId) => {
    setRows((current) => [...current, createBlankRow(exerciseId)])
  }

  const handleRemoveRow = (rowId: string) => {
    setRows((current) => current.filter((row) => row.id !== rowId))
  }

  const handleCellChange = (rowId: string, field: string, value: string) => {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)))
  }

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

    defs.push({
      headerName: 'Actions',
      field: 'id',
      sortable: false,
      flex: 0.8,
      minWidth: 110,
      cellRenderer: (params: { data: PlanGridRow }) => {
        const row = params.data

        return (
          <button
            type="button"
            onClick={() => handleRemoveRow(row.id)}
            className="mt-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.95rem] font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Remove
          </button>
        )
      },
    })

    return defs
  }, [])

  return (
    <PageLayout>
      <PageCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Paragraph>Plans</Paragraph>
            <Heading1 className="mt-2">Create a new plan</Heading1>
          </div>
          <Link to="/plans" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
            Back to plans
          </Link>
        </div>

        <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Build the plan row by row</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Pick exercises directly in each row and build the plan one row at a time.
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <label className="flex min-w-64 flex-col gap-1 text-sm text-slate-600">
                  <span>Exercise</span>
                  <select
                    value={selectedExerciseId}
                    onChange={(event) => setSelectedExerciseId(event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                  >
                    <option value="">Select an exercise</option>
                    {exercises.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Button tone="emerald" onClick={() => handleAddRow(selectedExerciseId)} className="px-4 py-2">
                  Add row
                </Button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="ag-theme-quartz h-105 w-full">
                  <AgGridReact<PlanGridRow>
                    rowData={rows}
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
                  Create plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PageCard>
    </PageLayout>
  )
}
