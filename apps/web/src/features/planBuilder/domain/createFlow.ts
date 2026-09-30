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

/**
 * Returns the view model for the plan/assignment create or edit flow.
 * Labels differ depending on whether the user is creating an assignment or a
 * standalone plan, and whether they are editing an existing record.
 *
 * @param context - Whether this is an assignment route and/or edit mode.
 * @returns CreateFlowViewModel with titles, labels, and placeholder text.
 */
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
    title: isEditMode ? 'Edit plan' : 'Create plan',
    backLabel: 'Back to plans',
    saveLabel: isEditMode ? 'Save changes' : 'Create plan',
    planNamePlaceholder: 'Plan name',
  }
}

/**
 * Returns true when at least one plan session contains one or more plan items.
 * Used to determine whether the builder has meaningful content before saving.
 *
 * @param sessions - The current plan builder sessions.
 */
export function hasBuilderContent(sessions: BuilderSessionLike[] | undefined) {
  return (sessions ?? []).some(
    (session) => (session.planItems?.length ?? 0) > 0,
  )
}
