import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getToneClass } from '../../components/toneClasses'
import { usePlan } from '@gym-pilot/shared'
import { PageCard } from '../../components/PageCard'
import { PageLayout } from '../../layouts/PageLayout'
import { Heading1, Paragraph } from '../../components/Typography'
import { PlanBuilderWorkspace } from '../../components/PlanBuilderWorkspace'
import { usePlanBuilderFeature } from '../../features/planBuilder/hooks/usePlanBuilderFeature'
import {
  hasBuilderContent,
  resolveCreateFlowViewModel,
} from '../../features/planBuilder/domain/createFlow'

export function CreateAssignmentPage() {
  const {
    assignments,
    visiblePlans,
    visibleUsers,
    updateAssignment,
    assignUsersToPlan,
  } = usePlan()
  const navigate = useNavigate()
  const { planSlug } = useParams()
  const assignmentToEdit = useMemo(
    () => assignments.find((item) => item.id === planSlug),
    [assignments, planSlug],
  )
  const isEditMode = Boolean(assignmentToEdit)
  const createFlowViewModel = useMemo(
    () => resolveCreateFlowViewModel({ isAssignmentRoute: true, isEditMode }),
    [isEditMode],
  )
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const sourcePlans = useMemo(() => visiblePlans, [visiblePlans])

  const {
    tabs,
    activeTabId,
    selectedExerciseId,
    selectedExerciseName,
    favoriteExercises,
    favoriteLinks,
    isFullscreen,
    activeRows,
    setActiveTabId,
    setSelectedExerciseId,
    setSelectedExerciseName,
    setIsFullscreen,
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
  } = usePlanBuilderFeature(assignmentToEdit?.planSessions)

  useEffect(() => {
    if (!assignmentToEdit) {
      resetForCreate()
      return
    }

    hydrateFromPlan(assignmentToEdit)
  }, [assignmentToEdit, hydrateFromPlan, resetForCreate])

  const handleSaveAssignment = () => {
    if (isEditMode && assignmentToEdit) {
      const planSessions = buildPlanSessions()

      if (!hasBuilderContent(planSessions)) {
        return
      }

      updateAssignment(assignmentToEdit.id, assignmentToEdit.id, planSessions)
      navigate(
        `/users/${assignmentToEdit.assignedUserId ?? 'user'}/assignments/${assignmentToEdit.id}`,
      )
      return
    }

    if (!selectedPlanId || !selectedUserId) {
      return
    }

    assignUsersToPlan(selectedPlanId, [selectedUserId])
    navigate(`/users/${selectedUserId}/assignments`)
  }

  return (
    <PageLayout>
      <PageCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Paragraph>Assignments</Paragraph>
            <Heading1 className="mt-2">{createFlowViewModel.title}</Heading1>
          </div>
          <Link
            to="/assignments"
            className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
          >
            Back to assignments
          </Link>
        </div>

        <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:mt-6 sm:space-y-6 sm:p-4">
          {!isEditMode ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">
                    User
                  </span>
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
                  <span className="text-sm font-medium text-slate-700">
                    Base plan
                  </span>
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
            onSave={handleSaveAssignment}
            saveLabel={createFlowViewModel.saveLabel}
            saveDisabled={
              isEditMode
                ? !assignmentToEdit
                : !selectedPlanId || !selectedUserId
            }
          />
        </div>
      </PageCard>
    </PageLayout>
  )
}
