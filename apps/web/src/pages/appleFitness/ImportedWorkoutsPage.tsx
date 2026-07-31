import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { PageLayout } from '../../layouts/PageLayout'
import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification'
import { getImportedWorkouts, updateImportedWorkout } from '@gym-pilot/shared'
import type { ImportedWorkout } from '@gym-pilot/shared'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import type { ColDef, ValueSetterParams } from 'ag-grid-community'
import WorkoutCalendar from '../../components/WorkoutCalendar' // Import the new component

export function ImportedWorkoutsPage() {
  const { user } = useAuth()
  const gridRef = useRef<AgGridReact<ImportedWorkout>>(null)
  const [workouts, setWorkouts] = useState<ImportedWorkout[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const userId = user?.id ?? null

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setSuccessMessage(message)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    let isActive = true

    const loadWorkouts = async () => {
      try {
        if (userId == null) {
          setWorkouts([])
          setErrorMessage(null)
          return
        }

        const { data } = await getImportedWorkouts(userId)

        console.log('Loaded imported workouts:', data)
        if (!isActive) {
          return
        }

        setWorkouts(data ?? [])
        setErrorMessage(null)
      } catch (error) {
        if (!isActive) {
          return
        }

        setErrorMessage(String(error))
      }
    }

    void loadWorkouts()

    return () => {
      isActive = false
    }
  }, [userId])

  const onCellValueChanged = useCallback(async (event: any) => {
    try {
      await updateImportedWorkout(event.data)
    } catch (error) {
      setErrorMessage(String(error))
      // Note: In a real app, you might want to revert the change in the grid.
    }
  }, [])

  const columnDefs: ColDef<ImportedWorkout>[] = useMemo(
    () => [
      {
        field: 'display_name',
        headerName: 'Name',
        filter: true,
        floatingFilter: true,
      },
      {
        field: 'start_date',
        headerName: 'Start Date',
        filter: 'agDateColumnFilter',
      },
      {
        field: 'duration',
        headerName: 'Duration (mins)',
        valueSetter: (params: ValueSetterParams) => {
          params.data.duration = Number(params.newValue)
          return true
        },
      },
      {
        field: 'energy',
        headerName: 'Energy',
        valueSetter: (params: ValueSetterParams) => {
          params.data.energy = Number(params.newValue)
          return true
        },
      },
      { field: 'energy_unit', headerName: 'Energy Unit' },
    ],
    [],
  )

  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      minWidth: 100,
      sortable: true,
      filter: true,
      editable: false,
    }
  }, [])

  const onExportClick = useCallback(() => {
    gridRef.current?.api.exportDataAsCsv()
  }, [])

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      setSearchParams({ date: `${year}-${month}-${day}` })
    }
  }

  const initialDate = useMemo(() => {
    const dateStr = searchParams.get('date')
    if (dateStr) {
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // month is 0-indexed
        const day = parseInt(parts[2], 10)
        const date = new Date(year, month, day)

        if (!isNaN(date.getTime())) {
          return date
        }
      }
    }
    return new Date()
  }, [searchParams])

  return (
    <PageLayout className="max-w-6xl">
      <PageCardLayout
        title="Imported Workouts"
        subtitle="View and manage your imported workouts"
        description=""
        icon="edit"
      >
        {successMessage && (
          <StatusMessageNotification
            message={successMessage}
            tone="success"
            className="mb-3"
          />
        )}
        {errorMessage ? (
          <StatusMessageNotification
            message={errorMessage}
            tone="error"
            className="mb-3"
          />
        ) : null}

        <div className="mb-4">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 hover:font-semibold hover:shadow-sm"
            onClick={onExportClick}
          >
            Export as CSV
          </button>
        </div>

        <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={workouts}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={20}
            onCellValueChanged={onCellValueChanged}
          />
        </div>

        {/* Add the WorkoutCalendar component below the grid */}
        <div className="mt-8">
          <WorkoutCalendar
            workouts={workouts}
            title="Workout Overview Calendar"
            initialDate={initialDate}
            onDateChange={handleDateChange}
          />
        </div>
      </PageCardLayout>
    </PageLayout>
  )
}
