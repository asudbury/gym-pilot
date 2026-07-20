import { Navigate, Route } from 'react-router-dom'
import { RequireAuth } from '../auth/RequireAuth'
import { AssignmentDetailPage } from '../pages/assignments/AssignmentDetailPage'
import { AssignmentsManagerPage } from '../pages/assignments/AssignmentsManagerPage'
import { AssignmentsPage } from '../pages/assignments/AssignmentsPage'
import { CreateAssignmentPage } from '../pages/assignments/CreateAssignmentPage'
import { SessionEditPage } from '../pages/SessionEditPage'
import { SessionHistoryPage } from '../pages/SessionHistoryPage'
import { HomePage } from '../pages/HomePage'
import { CreatePlanPage } from '../pages/plans/CreatePlanPage'
import { PlanDetailPage } from '../pages/plans/PlanDetailPage'
import { PlansPage } from '../pages/plans/PlansPage'
import { TimetablePage } from '../pages/TimetablePage'
import { RecordSessionPage } from '../pages/RecordSessionPage'
import { TrainerReportPage } from '../pages/TrainerReportPage'
import { type HomeFilters } from '../utils/appUtils'

interface ProtectedRoutesProps {
  homeFilters: HomeFilters
  onHomeFiltersChange: (filters: HomeFilters) => void
  onToggleFavoriteExercise: (exerciseId: string) => void
  isExerciseFavorite: (exerciseId: string) => boolean
}

export function createProtectedRoutes({
  homeFilters,
  onHomeFiltersChange,
  onToggleFavoriteExercise,
  isExerciseFavorite,
}: ProtectedRoutesProps) {
  return (
    <Route element={<RequireAuth />}>
      <Route
        path="/exercises"
        element={
          <HomePage
            filters={homeFilters}
            onFiltersChange={onHomeFiltersChange}
            onToggleFavoriteExercise={onToggleFavoriteExercise}
            isExerciseFavorite={isExerciseFavorite}
          />
        }
      />
      <Route path="/plans" element={<PlansPage />} />
      <Route element={<RequireAuth requireClubId />}>
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/record-session" element={<RecordSessionPage />} />
        <Route path="/sessions" element={<SessionHistoryPage />} />
        <Route path="/sessions/:entryId/edit" element={<SessionEditPage />} />
        <Route path="/trainer-report" element={<TrainerReportPage />} />
      </Route>
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
    </Route>
  )
}
