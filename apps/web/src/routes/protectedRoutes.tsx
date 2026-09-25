import { lazy } from 'react'
import { Route } from 'react-router-dom'
import { RequireAuth } from '../auth/RequireAuth'

const AppleFitnessPage = lazy(async () => ({
  default: (await import('../pages/appleFitness/AppleFitnessPage'))
    .AppleFitnessPage,
}))
const LinkAppleWorkoutPage = lazy(async () => ({
  default: (await import('../pages/appleFitness/LinkAppleWorkoutPage'))
    .LinkAppleWorkoutPage,
}))
const SpreadsheetImportConfirmPage = lazy(
  () => import('../pages/appleFitness/SpreadsheetImportConfirmPage'),
)
const SpreadsheetImportPage = lazy(async () => ({
  default: (await import('../pages/appleFitness/SpreadsheetImportPage'))
    .SpreadsheetImportPage,
}))
const SpreadsheetImportPreviewDetailPage = lazy(
  () => import('../pages/appleFitness/SpreadsheetImportPreviewDetailPage'),
)
const SpreadsheetImportPreviewPage = lazy(async () => ({
  default: (await import('../pages/appleFitness/SpreadsheetImportPreviewPage'))
    .SpreadsheetImportPreviewPage,
}))
const AssignmentCreatePage = lazy(async () => ({
  default: (await import('../pages/assignments/AssignmentCreatePage'))
    .AssignmentCreatePage,
}))
const WorkoutAssignmentsPage = lazy(async () => ({
  default: (await import('../pages/assignments/WorkoutAssignmentsPage'))
    .WorkoutAssignmentsPage,
}))
const HelpPage = lazy(() => import('../pages/HelpPage'))
const HomePage = lazy(async () => ({
  default: (await import('../pages/HomePage')).HomePage,
}))
const IconShowcasePage = lazy(async () => ({
  default: (await import('../pages/IconShowcasePage')).IconShowcasePage,
}))
const ImportedWorkoutAnalysisPage = lazy(async () => ({
  default: (await import('../pages/ImportedWorkoutAnalysisPage'))
    .ImportedWorkoutAnalysisPage,
}))
const RecordSessionPage = lazy(async () => ({
  default: (await import('../pages/RecordSessionPage')).RecordSessionPage,
}))
const SessionEditPage = lazy(async () => ({
  default: (await import('../pages/SessionEditPage')).SessionEditPage,
}))
const SessionHistoryPage = lazy(async () => ({
  default: (await import('../pages/SessionHistoryPage')).SessionHistoryPage,
}))
const TimetablePage = lazy(async () => ({
  default: (await import('../pages/TimetablePage')).TimetablePage,
}))
const WorkoutPlanEditPage = lazy(
  () => import('../pages/workoutPlans/WorkoutPlanEditPage'),
)
const WorkoutPlansPage = lazy(async () => ({
  default: (await import('../pages/workoutPlans/WorkoutPlansPage'))
    .WorkoutPlansPage,
}))
const WorkoutTemplateCreatePage = lazy(
  () => import('../pages/workoutTemplates/WorkoutTemplateCreatePage'),
)
const WorkoutTemplateEditPage = lazy(
  () => import('../pages/workoutTemplates/WorkoutTemplateEditPage'),
)
const WorkoutTemplatesPage = lazy(async () => ({
  default: (await import('../pages/workoutTemplates/WorkoutTemplatesPage'))
    .WorkoutTemplatesPage,
}))

export function createProtectedRoutes() {
  return (
    <Route element={<RequireAuth />}>
      <Route path="/exercises" element={<HomePage />} />
      <Route element={<RequireAuth requireClubId />}>
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/record-session" element={<RecordSessionPage />} />
        <Route path="/sessions" element={<SessionHistoryPage />} />
        <Route path="/sessions/:entryId/edit" element={<SessionEditPage />} />
      </Route>
      <Route path="/analysis" element={<ImportedWorkoutAnalysisPage />} />
      <Route path="/workout-assignments" element={<WorkoutAssignmentsPage />} />
      <Route
        path="/workout-assignments/create"
        element={<AssignmentCreatePage />}
      />
      <Route path="/workout-templates" element={<WorkoutTemplatesPage />} />
      <Route
        path="/workout-templates/create"
        element={<WorkoutTemplateCreatePage />}
      />
      <Route
        path="/workout-templates/:id/edit"
        element={<WorkoutTemplateEditPage />}
      />
      <Route path="/workout-plans" element={<WorkoutPlansPage />} />
      <Route path="/workout-plans/create" element={<WorkoutPlanEditPage />} />
      <Route path="/workout-plans/:id/edit" element={<WorkoutPlanEditPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/apple-fitness" element={<AppleFitnessPage />} />
      <Route
        path="/apple-fitness/import-spreadsheet"
        element={<SpreadsheetImportPage />}
      />
      <Route
        path="/apple-fitness/import-spreadsheet/preview"
        element={<SpreadsheetImportPreviewPage />}
      />
      <Route
        path="/apple-fitness/import-spreadsheet/preview/:index"
        element={<SpreadsheetImportPreviewDetailPage />}
      />
      <Route
        path="/apple-fitness/import-spreadsheet/confirm"
        element={<SpreadsheetImportConfirmPage />}
      />
      <Route
        path="/apple-fitness/link-workout/:workoutId"
        element={<LinkAppleWorkoutPage />}
      />
      <Route path="/icons" element={<IconShowcasePage />} />
    </Route>
  )
}
