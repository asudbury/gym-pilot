import { Navigate, Route } from 'react-router-dom';
import { RequireAuth } from '../auth/RequireAuth';
import { AppleFitnessPage } from '../pages/appleFitness/AppleFitnessPage';
import { LinkAppleWorkoutPage } from '../pages/appleFitness/LinkAppleWorkoutPage';
import { AssignmentDetailPage } from '../pages/assignments/AssignmentDetailPage';
import { AssignmentsManagerPage } from '../pages/assignments/AssignmentsManagerPage';
import { AssignmentsPage } from '../pages/assignments/AssignmentsPage';
import { CreateAssignmentPage } from '../pages/assignments/CreateAssignmentPage';
import { HomePage } from '../pages/HomePage';
import { IconShowcasePage } from '../pages/IconShowcasePage';
import { ImportedWorkoutAnalysisPage } from '../pages/ImportedWorkoutAnalysisPage';
import { CreatePlanPage } from '../pages/plans/CreatePlanPage';
import { PlanDetailPage } from '../pages/plans/PlanDetailPage';
import { PlansPage } from '../pages/plans/PlansPage';
import { RecordSessionPage } from '../pages/RecordSessionPage';
import { SessionEditPage } from '../pages/SessionEditPage';
import { SessionHistoryPage } from '../pages/SessionHistoryPage';
import SessionTemplateCreatePage from '../pages/SessionTemplateCreatePage';
import { SessionTemplatesPage } from '../pages/SessionTemplatesPage';
import { TimetablePage } from '../pages/TimetablePage';
export function createProtectedRoutes() {
  return (
    <Route element={<RequireAuth />}>
      <Route path="/exercises" element={<HomePage />} />
      <Route path="/plans" element={<PlansPage />} />
      <Route element={<RequireAuth requireClubId />}>
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/record-session" element={<RecordSessionPage />} />
        <Route path="/sessions" element={<SessionHistoryPage />} />
        <Route path="/sessions/:entryId/edit" element={<SessionEditPage />} />
      </Route>
      <Route path="/analysis" element={<ImportedWorkoutAnalysisPage />} />
      <Route path="/assignments" element={<AssignmentsPage />} />
      <Route
        path="/users/:userSlug/assignments"
        element={<AssignmentsPage />}
      />
      <Route
        path="/users/:userSlug/assignments/create"
        element={<AssignmentsManagerPage />}
      />
      <Route path="/plans/new" element={<CreatePlanPage />} />
      <Route path="/plans/:planSlug/edit" element={<CreatePlanPage />} />
      <Route path="/plans/:planSlug" element={<PlanDetailPage />} />
      <Route path="/assignments/new" element={<AssignmentsManagerPage />} />
      <Route
        path="/assignments/create"
        element={<Navigate to="/assignments/new" replace />}
      />
      <Route
        path="/users/:userSlug/assignments/new"
        element={<AssignmentsManagerPage />}
      />
      <Route
        path="/users/:userSlug/assignments/create"
        element={<Navigate to="../new" replace />}
      />
      <Route
        path="/users/:userSlug/assignments/:planSlug"
        element={<AssignmentDetailPage />}
      />
      <Route
        path="/users/:userSlug/assignments/:planSlug/edit"
        element={<CreateAssignmentPage />}
      />
      <Route path="/session-templates" element={<SessionTemplatesPage />} />
      <Route
        path="/session-templates/create"
        element={<SessionTemplateCreatePage />}
      />
      <Route path="/apple-fitness" element={<AppleFitnessPage />} />
      <Route
        path="/apple-fitness/link-workout/:workoutId"
        element={<LinkAppleWorkoutPage />}
      />
      <Route path="/icons" element={<IconShowcasePage />} />
    </Route>
  )
}
