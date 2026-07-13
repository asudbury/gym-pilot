import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { getToneClass } from './components/toneClasses'
import { ResponsiveVisibility } from './components/ResponsiveVisibility'
import { usePlan } from '@gym-pilot/shared'
import { ExercisePage } from './pages/ExercisePage'
import { HomePage } from './pages/HomePage'
import { AssignmentDetailPage } from './pages/AssignmentDetailPage'
import { AssignmentsPage } from './pages/AssignmentsPage'
import { CreateAssignmentPage } from './pages/CreateAssignmentPage'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

function App() {
  const { assignments } = usePlan()

  return (
    <div className="min-h-screen bg-slate-50">
      <ScrollToTop />
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="text-lg font-semibold text-slate-900">
            GymPilot
          </NavLink>
          <div className="flex flex-wrap gap-2">
            <ResponsiveVisibility visibleOn="desktop">
              <NavLink
                to="/assignments"
                className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}
              >
                Assignments ({assignments.length})
              </NavLink>
            </ResponsiveVisibility>
            <ResponsiveVisibility visibleOn="tablet">
              <NavLink to="/assignments/new" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
                Create assignment
              </NavLink>
            </ResponsiveVisibility>
            <ResponsiveVisibility visibleOn="mobile">
              <NavLink to="/assignments" className={getToneClass('default', 'px-4 py-2 text-sm font-medium')}>
                Menu
              </NavLink>
            </ResponsiveVisibility>
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
