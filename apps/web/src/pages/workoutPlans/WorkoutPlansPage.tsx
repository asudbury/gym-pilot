import { getSupabaseClient } from '@gym-pilot/shared'
import { TableNames } from '@gym-pilot/shared/src/dataServices/tableNames'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageCard } from '../../components/PageCard'
import { Button } from '../../components/ui/Button'
import { formatDateTimeForDisplay } from '../../dateTimeFormatter'
import { PageCardLayout } from '../../layouts/PageCardLayout'
import { PageLayout } from '../../layouts/PageLayout'

export function WorkoutPlansPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filterText, setFilterText] = useState('')

  const description = 'Create a workout plan to define exercises.'

  async function loadPlans() {
    setLoading(true)
    const client = getSupabaseClient()
    if (!client) {
      setPlans([])
      setLoading(false)
      return
    }

    const { data, error } = await client
      .from(TableNames.WorkoutPlan)
      .select('*, workout_plan_exercise(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Could not load workout plans', error)
      setPlans([])
      setLoading(false)
      return
    }

    setPlans(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    void loadPlans()
  }, [])

  const filteredPlans = useMemo(
    () =>
      plans.filter((t) =>
        t.plan_name.toLowerCase().includes(filterText.toLowerCase()),
      ),
    [plans, filterText],
  )

  return (
    <PageLayout>
      <PageCardLayout
        title="Workout Plans"
        subtitle="Dashboard"
        description={description}
      >
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full max-w-sm">
            <input
              type="text"
              placeholder="Search..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-slate-500 focus:border-slate-500"
            />
          </div>
          <div>
            <Button
              as={Link}
              to="/workout-templates"
              tone="default"
              className="mr-2"
            >
              Templates
            </Button>
            <Button as={Link} to="/workout-plans/create" tone="blue">
              Create plan
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading plans…</p>
        ) : plans.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No plans yet. Create one using the button above.
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No plans match your search.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {filteredPlans.map((t) => (
              <PageCard
                key={t.id}
                padding="compact"
                onClick={() => navigate(`/workout-plans/${t.id}/edit`)}
                className="cursor-pointer"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {t.plan_name}{' '}
                      <span className="text-xs text-slate-500">(plan)</span>
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {t.description}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Exercises:{' '}
                      {Array.isArray(t.workout_plan_exercise)
                        ? t.workout_plan_exercise.length
                        : 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last updated:{' '}
                      {formatDateTimeForDisplay(t.updated_at, {
                        includeYear: false,
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      as={Link}
                      to={`/workout-plans/${t.id}/edit`}
                      tone="chip"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </PageCard>
            ))}
          </div>
        )}
      </PageCardLayout>
    </PageLayout>
  )
}
