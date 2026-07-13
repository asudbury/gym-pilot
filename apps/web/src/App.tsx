import { NavLink, Route, Routes } from 'react-router-dom'
import { getToneClass } from './components/toneClasses'
import { usePlan } from '@gym-pilot/shared'
import { ExercisePage } from './pages/ExercisePage'
import { HomePage } from './pages/HomePage'
import { AssignmentDetailPage } from './pages/AssignmentDetailPage'
import { AssignmentsPage } from './pages/AssignmentsPage'
import { CreateAssignmentPage } from './pages/CreateAssignmentPage'

function App() {
  const { assignments } = usePlan()

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="text-lg font-semibold text-slate-900">
            GymPilot
          </NavLink>
          <div className="flex flex-wrap gap-2">
            <NavLink
              to="/assignments"
              className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
            >
              Assignments ({assignments.length})
            </NavLink>
            <NavLink to="/assignments/new" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
              Create assignment
            </NavLink>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/exercise/:id" element={<ExercisePage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/assignments/new" element={<CreateAssignmentPage />} />
        <Route path="/assignments/:assignmentSlug" element={<AssignmentDetailPage />} />
      </Routes>
    </div>
  )
}

export default App
