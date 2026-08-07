import { getSupabaseClient } from '@gym-pilot/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageCard } from '../../components/PageCard';
import { Button } from '../../components/ui/Button';
import { formatDateTimeForDisplay } from '../../dateTimeFormatter';
import { PageCardLayout } from '../../layouts/PageCardLayout';
import { PageLayout } from '../../layouts/PageLayout';

export function WorkoutTemplatesPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filterText, setFilterText] = useState('')

  const description = 'Create a workout template to define exercises.'

  async function loadTemplates() {
    setLoading(true)
    const client = getSupabaseClient()
    if (!client) {
      setTemplates([])
      setLoading(false)
      return
    }

    const { data, error } = await client
      .from('workout_template')
      .select('*, workout_template_exercise(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Could not load workout templates', error)
      setTemplates([])
      setLoading(false)
      return
    }

    setTemplates(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    void loadTemplates()
  }, [])

  const filteredTemplates = useMemo(
    () =>
      templates.filter((t) =>
        t.name.toLowerCase().includes(filterText.toLowerCase()),
      ),
    [templates, filterText],
  )

  return (
    <PageLayout>
      <PageCardLayout
        title="Workout Templates"
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
          <Button as={Link} to="/plans" tone="default" className="mr-2">
            Plans
          </Button>
          <Button as={Link} to="/workout-templates/create" tone="blue">
            Create template
          </Button>
          </div>

        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading templates…</p>
        ) : templates.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No templates yet. Create one using the button above.
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No templates match your search.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {filteredTemplates.map((t) => (
              <PageCard
                key={t.id}
                padding="compact"
                onClick={() => navigate(`/workout-templates/${t.id}/edit`)}
                className="cursor-pointer"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {t.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {t.description}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      Exercises:{' '}
                      {Array.isArray(t.workout_template_exercise)
                        ? t.workout_template_exercise.length
                        : 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Last updated:{' '}
                      {formatDateTimeForDisplay(t.created_at, {
                        includeYear: false,
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      as={Link}
                      to={`/workout-templates/${t.id}/edit`}
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
