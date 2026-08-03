import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { BackLink } from '../../components/ui/BackLink'
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

export function CreatePlanPage() {
  const { createPlan, plans, updatePlan } = usePlan()
  const navigate = useNavigate()
  const location = useLocation()
  const { planSlug } = useParams()
  const planToEdit = useMemo(
    () => plans.find((item) => item.planSlug === planSlug),
    [plans, planSlug],
  )
  const isAssignmentRoute = location.pathname.includes('/assignments/')
  const isEditMode = Boolean(planToEdit)
  const createFlowViewModel = useMemo(
    () => resolveCreateFlowViewModel({ isAssignmentRoute, isEditMode }),
    [isAssignmentRoute, isEditMode],
  )

  const {
    tabs,
    activeTabId,
    selectedExerciseId,
    selectedExerciseName,
    favoriteExercises,
    favoriteLinks,
    personNamesInput,
    activeRows,
    setActiveTabId,
    setSelectedExerciseId,
    setSelectedExerciseName,
    setPersonNamesInput,
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
  } = usePlanBuilderFeature(planToEdit?.planSessions)

  useEffect(() => {
    if (!planToEdit) {
      resetForCreate()
      return
    }

    hydrateFromPlan(planToEdit)
  }, [hydrateFromPlan, planToEdit, resetForCreate])

  const handleAssignPlan = () => {
    const planSessions = buildPlanSessions()

    if (!hasBuilderContent(planSessions)) {
      return
    }

    const planName = personNamesInput.trim() || 'Untitled plan'

    if (isEditMode && planToEdit) {
      updatePlan(planToEdit.id, planName, planSessions)
      navigate(isAssignmentRoute ? '/users' : `/plans/${planToEdit.planSlug}`)
      return
    }

    createPlan(planName, planSessions)
    resetForCreate()
    navigate(isAssignmentRoute ? '/users' : '/plans')
  }

  return (
    <PageLayout>
      <PageCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Paragraph>Plans</Paragraph>
            <Heading1 className="mt-2">{createFlowViewModel.title}</Heading1>
          </div>
          <BackLink to="/plans" label="Back to plans" />
        </div>

        <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:mt-6 sm:space-y-6 sm:p-4">
          <PlanBuilderWorkspace
            tabs={tabs}
            activeTabId={activeTabId}
            activeRows={activeRows}
            favoriteExercises={favoriteExercises}
            selectedExerciseName={selectedExerciseName}
            selectedExerciseId={selectedExerciseId}
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
            planNamePlaceholder={createFlowViewModel.planNamePlaceholder}
            onSave={handleAssignPlan}
            saveLabel={createFlowViewModel.saveLabel}
          />
        </div>
      </PageCard>
    </PageLayout>
  )
}
