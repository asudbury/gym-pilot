import { useMemo, useState, type DragEvent } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  provideGlobalGridOptions,
  type ColDef,
} from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import { exercises } from '@gym-pilot/shared'
import { Button } from './Button'
import { ExerciseSearchPicker } from './exercises/ExerciseSearchPicker'
import { formatLabel } from '../utils/formatUtils'
import { type QuickLink } from '../utils/favouriteUtils'
import { type PlanGridRow, type PlanTab } from '../utils/planBuilderUtils'
import { resolveFavoriteLinkGroups } from '../features/planBuilder/domain/builderWorkspace'

ModuleRegistry.registerModules([AllCommunityModule])
provideGlobalGridOptions({ theme: 'legacy' })

export interface PlanBuilderWorkspaceProps {
  tabs: PlanTab[]
  activeTabId: string | null
  activeRows: PlanGridRow[]
  favoriteExercises: Array<{ id: string; name: string }>
  favoriteLinks?: QuickLink[]
  selectedExerciseName: string
  selectedExerciseId: string
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onExportToExcel: () => void
  onExerciseSelection: (exerciseId: string, exerciseName: string) => void
  onAddLinkRows?: (links: Array<{ label: string; path: string }>) => void
  onSearchChange?: (value: string) => void
  onActivateTab?: (tabId: string) => void
  onAddRow: (exerciseId?: string) => void
  onAddTab: () => void
  onRenameTab: (tabId: string, nextTitle: string) => void
  onRemoveTab: (tabId: string) => void
  onMoveRow: (rowId: string, direction: -1 | 1) => void
  onRemoveRow: (rowId: string) => void
  onCellChange: (rowId: string, field: string, value: string) => void
  planNameValue?: string
  onPlanNameChange?: (value: string) => void
  showPlanNameInput?: boolean
  planNamePlaceholder?: string
  saveLabel: string
  onSave: () => void
  saveDisabled?: boolean
}

export function PlanBuilderWorkspace({
  tabs,
  activeTabId,
  activeRows,
  favoriteExercises,
  favoriteLinks = [],
  selectedExerciseName,
  selectedExerciseId,
  isFullscreen,
  onToggleFullscreen,
  onExportToExcel,
  onExerciseSelection,
  onAddLinkRows,
  onSearchChange,
  onActivateTab,
  onAddRow,
  onAddTab,
  onRenameTab,
  onRemoveTab,
  onMoveRow,
  onRemoveRow,
  onCellChange,
  planNameValue,
  onPlanNameChange,
  showPlanNameInput = false,
  planNamePlaceholder = 'Plan name',
  saveLabel,
  onSave,
  saveDisabled = false,
}: PlanBuilderWorkspaceProps) {
  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [activeTabId, tabs],
  )
  const [isDropActive, setIsDropActive] = useState(false)

  const groupedFavoriteLinks = useMemo(
    () => resolveFavoriteLinkGroups(favoriteLinks),
    [favoriteLinks],
  )

  const handleDropLinks = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDropActive(false)

    const payload =
      event.dataTransfer.getData('application/x-gym-pilot-links') ||
      event.dataTransfer.getData('text/plain')

    if (!payload) {
      return
    }

    try {
      const parsed = JSON.parse(payload) as
        | { items?: Array<{ label: string; path: string }> }
        | Array<{ label: string; path: string }>
      const links = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.items)
          ? parsed.items
          : []

      onAddLinkRows?.(
        links.filter(
          (item) =>
            item &&
            typeof item.label === 'string' &&
            typeof item.path === 'string',
        ),
      )
    } catch {
      // Ignore invalid payloads.
    }
  }

  const columnDefs = useMemo<ColDef<PlanGridRow>[]>(() => {
    const defs: ColDef<PlanGridRow>[] = [
      {
        headerName: 'Item',
        field: 'exerciseId',
        editable: false,
        flex: 2,
        minWidth: 220,
        cellClass: 'ag-cell-padding',
        valueFormatter: (params) => {
          const row = params.data as PlanGridRow | undefined

          if (row?.linkLabel?.trim()) {
            return row.linkLabel
          }

          const exercise = exercises.find((item) => item.id === params.value)
          return exercise?.name ?? ''
        },
        onCellValueChanged: (params) => {
          onCellChange(
            params.data?.id ?? '',
            'exerciseId',
            params.newValue as string,
          )
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
          onCellChange(params.data?.id ?? '', 'reps', params.newValue as string)
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
          onCellChange(
            params.data?.id ?? '',
            'workingSets',
            params.newValue as string,
          )
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
          onCellChange(
            params.data?.id ?? '',
            'notes',
            params.newValue as string,
          )
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
        cellRenderer: (params: {
          data: PlanGridRow
          node?: { rowIndex?: number | null }
        }) => {
          const row = params.data
          const rowIndex = params.node?.rowIndex
          const isFirstRow = typeof rowIndex === 'number' && rowIndex <= 0
          const isLastRow =
            typeof rowIndex === 'number' && rowIndex >= activeRows.length - 1

          return (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onMoveRow(row.id, -1)}
                disabled={isFirstRow}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.95rem] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Move row up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMoveRow(row.id, 1)}
                disabled={isLastRow}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.95rem] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Move row down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onRemoveRow(row.id)}
                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[0.95rem] font-medium text-rose-700 hover:bg-rose-100"
              >
                Remove
              </button>
            </div>
          )
        },
      })
    }

    return defs
  }, [activeRows.length, isFullscreen, onCellChange, onMoveRow, onRemoveRow])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button tone="blue" onClick={onExportToExcel} className="px-4 py-2">
              Export Excel
            </Button>
            {!isFullscreen ? (
              <Button
                tone="default"
                onClick={onToggleFullscreen}
                className="px-4 py-2"
              >
                Full screen
              </Button>
            ) : null}
          </div>
        </div>

        <p className="text-sm text-slate-600">
          Each tab is exported as a separate worksheet in a single workbook.
        </p>

        {!isFullscreen ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
              <div className="w-full min-w-0 sm:min-w-72 sm:flex-1">
                <ExerciseSearchPicker
                  id="plan-exercise-search"
                  label="Exercise"
                  value={selectedExerciseName}
                  placeholder="Search exercises"
                  onChange={(nextValue) => {
                    onSearchChange?.(nextValue)
                  }}
                  onSelectExercise={(exercise) => {
                    onExerciseSelection(exercise.id, exercise.name)
                  }}
                />
              </div>
              <Button
                tone="emerald"
                onClick={() => onAddRow(selectedExerciseId)}
                className="px-4 py-2"
              >
                Add row
              </Button>
            </div>
          </div>
        ) : null}

        <div
          className={
            isFullscreen
              ? 'fixed inset-3 z-50 flex flex-col overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-2xl'
              : `overflow-hidden rounded-2xl border ${isDropActive ? 'border-emerald-400 bg-emerald-50/70' : 'border-slate-200 bg-white'}`
          }
          onDragEnter={(event) => {
            event.preventDefault()
            setIsDropActive(true)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDropActive(true)
          }}
          onDragLeave={(event) => {
            event.preventDefault()
            setIsDropActive(false)
          }}
          onDrop={handleDropLinks}
        >
          {isFullscreen ? (
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
                <div className="w-full min-w-0 sm:min-w-72 sm:flex-1">
                  <ExerciseSearchPicker
                    id="plan-exercise-search-fullscreen"
                    label="Exercise"
                    value={selectedExerciseName}
                    placeholder="Search exercises"
                    onChange={(nextValue) => {
                      onSearchChange?.(nextValue)
                    }}
                    onSelectExercise={(exercise) => {
                      onExerciseSelection(exercise.id, exercise.name)
                    }}
                  />
                </div>
                <Button
                  tone="emerald"
                  onClick={() => onAddRow(selectedExerciseId)}
                  className="px-4 py-2"
                >
                  Add row
                </Button>
              </div>
              <Button
                tone="default"
                onClick={onToggleFullscreen}
                className="px-4 py-2"
              >
                Exit full screen
              </Button>
            </div>
          ) : null}

          {isDropActive ? (
            <div className="border-b border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Drop favourite links here to add them to this plan.
            </div>
          ) : null}

          {favoriteExercises.length > 0 ? (
            <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 px-3 py-3">
              <span className="self-center text-sm font-medium text-slate-600">
                From favourites
              </span>
              {favoriteExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => onAddRow(exercise.id)}
                  className="cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium"
                >
                  {formatLabel(exercise.name)}
                </button>
              ))}
            </div>
          ) : null}

          {groupedFavoriteLinks.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-3">
              <span className="self-center text-sm font-medium text-slate-600">
                Favourite groups
              </span>
              {groupedFavoriteLinks.map((group) => (
                <button
                  key={group.folderName}
                  type="button"
                  onClick={() =>
                    onAddLinkRows?.(
                      group.links.map((link) => ({
                        label: link.label,
                        path: link.path,
                      })),
                    )
                  }
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  {group.folderName}
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
                  onChange={(event) => onRenameTab(tab.id, event.target.value)}
                  onFocus={() => onActivateTab?.(tab.id)}
                  onClick={() => onActivateTab?.(tab.id)}
                  aria-label={`Rename tab ${tab.title}`}
                  className="w-20 min-w-0 max-w-24 bg-transparent text-sm font-medium outline-none sm:w-24"
                  placeholder="Tab name"
                />
                {tabs.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onRemoveTab(tab.id)}
                    className="ml-1 rounded-full px-1 text-sm leading-none text-slate-500 hover:text-slate-700"
                    aria-label={`Remove tab ${tab.title}`}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ))}
            <Button tone="default" onClick={onAddTab} className="px-3 py-2">
              + Add tab
            </Button>
          </div>

          <div
            className={`ag-theme-quartz ${isFullscreen ? 'h-full' : 'h-96 sm:h-105'} w-full`}
          >
            <AgGridReact<PlanGridRow>
              key={activeTab?.id}
              rowData={activeRows}
              columnDefs={columnDefs}
              defaultColDef={{ resizable: true, editable: true }}
              domLayout="autoHeight"
              rowHeight={56}
              headerHeight={44}
              animateRows={true}
              theme="legacy"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-end">
          {showPlanNameInput ? (
            <input
              type="text"
              value={planNameValue ?? ''}
              onChange={(event) => onPlanNameChange?.(event.target.value)}
              placeholder={planNamePlaceholder}
              className="w-full min-w-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 sm:min-w-56 sm:w-auto"
            />
          ) : null}
          <Button
            tone="emerald"
            onClick={onSave}
            className="px-4 py-2"
            disabled={saveDisabled}
          >
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
