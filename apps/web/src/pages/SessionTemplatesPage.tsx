import { getSupabaseClient } from '@gym-pilot/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageCard } from '../components/PageCard';
import { Button } from '../components/ui/Button';
import { StatusMessageNotification } from '../components/ui/StatusMessageNotification';
import { PageCardLayout } from '../layouts/PageCardLayout';
import { PageLayout } from '../layouts/PageLayout';

export function SessionTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

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

  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<'info' | 'error' | 'success'>(
    'info',
  )

  async function deleteTemplate(id: string) {
    const client = getSupabaseClient()
    if (!client) return

    setStatusMessage(null)
    try {
      const { error } = await client
        .from('workout_template')
        .delete()
        .eq('id', id)
      if (error) {
        setStatusTone('error')
        setStatusMessage(error.message)
        return
      }

      setStatusTone('success')
      setStatusMessage('Template deleted')
      setPendingDeleteId(null)
      void loadTemplates()
    } catch (err) {
      setStatusTone('error')
      setStatusMessage('Unexpected error deleting template')
    }
  }

  return (
    <PageLayout>
      <PageCardLayout
        title="Workout Templates"
        subtitle="Dashboard"
        description={description}
      >
        <div className="flex justify-end">
          <Button as={Link} to="/session-templates/create" tone="blue">
            Create a new template
          </Button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading templates…</p>
        ) : templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No templates yet. Create one using the button above.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {templates.map((t) => (
              <PageCard key={t.id} padding="compact">
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
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      as={Link}
                      to={`/session-templates/${t.id}/edit`}
                      tone="chip"
                    >
                      Update
                    </Button>
                    {pendingDeleteId === t.id ? (
                      <>
                        <Button
                          tone="chip"
                          onClick={() => setPendingDeleteId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          tone="chip-destructive"
                          onClick={() => deleteTemplate(t.id)}
                        >
                          Confirm
                        </Button>
                      </>
                    ) : (
                      <Button
                        tone="chip-rose"
                        onClick={() => setPendingDeleteId(t.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </PageCard>
            ))}
          </div>
        )}
        {statusMessage ? (
          <div className="mt-4">
            <StatusMessageNotification
              message={statusMessage}
              tone={statusTone}
            />
          </div>
        ) : null}
        {null}
      </PageCardLayout>
    </PageLayout>
  )
}
