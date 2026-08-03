export type CreateFlowViewModel = {
  title: string
  backLabel: string
  saveLabel: string
  planNamePlaceholder: string
}

export type CreateFlowContext = {
  isAssignmentRoute: boolean
  isEditMode: boolean
}

export type BuilderSessionLike = {
  planItems: Array<unknown>
}

export function resolveCreateFlowViewModel({
  isAssignmentRoute,
  isEditMode,
}: CreateFlowContext): CreateFlowViewModel {
  if (isAssignmentRoute) {
    return {
      title: isEditMode ? 'Edit assignment' : 'Create a new assignment',
      backLabel: 'Back to assignments',
      saveLabel: isEditMode ? 'Save assignment' : 'Create assignment',
      planNamePlaceholder: 'Plan name',
    }
  }

  return {
    title: isEditMode ? 'Edit plan' : 'Create a new plan',
    backLabel: 'Back to plans',
    saveLabel: isEditMode ? 'Save changes' : 'Create plan',
    planNamePlaceholder: 'Plan name',
  }
}

export function hasBuilderContent(sessions: BuilderSessionLike[] | undefined) {
  return (sessions ?? []).some(
    (session) => (session.planItems?.length ?? 0) > 0,
  )
}
