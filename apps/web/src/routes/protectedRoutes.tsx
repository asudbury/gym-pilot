import { Navigate, Route } from 'react-router-dom';
import { RequireAuth } from '../auth/RequireAuth';
import { AppleFitnessPage } from '../pages/appleFitness/AppleFitnessPage';
import { LinkAppleWorkoutPage } from '../pages/appleFitness/LinkAppleWorkoutPage';
import SpreadsheetImportConfirmPage from '../pages/appleFitness/SpreadsheetImportConfirmPage';
import { SpreadsheetImportPage } from '../pages/appleFitness/SpreadsheetImportPage';
import SpreadsheetImportPreviewDetailPage from '../pages/appleFitness/SpreadsheetImportPreviewDetailPage';
import { SpreadsheetImportPreviewPage } from '../pages/appleFitness/SpreadsheetImportPreviewPage';
import HelpPage from '../pages/HelpPage';
import { HomePage } from '../pages/HomePage';
import { IconShowcasePage } from '../pages/IconShowcasePage';
import { ImportedWorkoutAnalysisPage } from '../pages/ImportedWorkoutAnalysisPage';
import { RecordSessionPage } from '../pages/RecordSessionPage';
import { SessionEditPage } from '../pages/SessionEditPage';
import { SessionHistoryPage } from '../pages/SessionHistoryPage';
import { TimetablePage } from '../pages/TimetablePage';
import WorkoutPlanEditPage from '../pages/workoutPlans/WorkoutPlanEditPage';
import { WorkoutPlansPage } from '../pages/workoutPlans/WorkoutPlansPage';
import WorkoutTemplateCreatePage from '../pages/workoutTemplates/WorkoutTemplateCreatePage';
import WorkoutTemplateEditPage from '../pages/workoutTemplates/WorkoutTemplateEditPage';
import { WorkoutTemplatesPage } from '../pages/workoutTemplates/WorkoutTemplatesPage';

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
      <Route
        path="/assignments/create"
        element={<Navigate to="/assignments/new" replace />}
      />
      <Route
        path="/users/:userSlug/assignments/create"
        element={<Navigate to="../new" replace />}
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
