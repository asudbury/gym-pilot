import { getSupabaseClient } from '@gym-pilot/shared';
import { TableNames } from '@gym-pilot/shared/src/dataServices/tableNames';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ExerciseMultiPicker } from '../../components/exercises/ExerciseMultiPicker';
import { ItemControls } from '../../components/ItemControls';
import { PageCard } from '../../components/PageCard';
import { Heading1, Paragraph } from '../../components/Typography';
import { BackLink } from '../../components/ui/BackLink';
import { Button } from '../../components/ui/Button';
import { PageLayout } from '../../layouts/PageLayout';
import { getExercisePath } from '../../utils/exerciseRouteUtils';
import { formatLabel } from '../../utils/formatUtils';
import { useIsDesktop } from '../../utils/useMediaQuery';

export default function WorkoutTemplateEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [localExercises, setLocalExercises] = useState<any[]>([])
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [moved, setMoved] = useState<string | null>(null)
  const isDesktop = useIsDesktop()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<'info' | 'error' | 'success'>(
    'info',
  )
  const [pendingDelete, setPendingDelete] = useState(false)

  async function loadTemplate() {
    if (!id) return
    setLoading(true)
    const client = getSupabaseClient()
    if (!client) {
      setTemplate(null)
      setLoading(false)
      return
    }

    const { data, error } = await client
      .from(TableNames.WorkoutTemplate)
      .select('*, workout_template_exercise(*)')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Could not load template', error)
      setTemplate(null)
      setLoading(false)
      return
    }

    setTemplate(data)
    setName(data.name ?? '')
    setDescription(data.description ?? '')
    setLocalExercises(
      Array.isArray(data.workout_template_exercise)
        ? [...data.workout_template_exercise].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
          )
        : [],
    )
    setLoading(false)
  }

  useEffect(() => {
    void loadTemplate()
  }, [id])

  async function handleSave() {
    if (!id) return
    const client = getSupabaseClient()
    if (!client) return

    setStatusMessage(null)
    const { error } = await client
      .from(TableNames.WorkoutTemplate)
      .update({ name, description: description || null })
      .eq('id', id)

    if (error) {
      setStatusTone('error')
      setStatusMessage(error.message)
      return
    }

    // persist positions for reordered exercises
    try {
      await Promise.all(
        localExercises.map((row, idx) => {
          const position = idx
          if (!row.id) return Promise.resolve(null)
          return client
            .from(TableNames.WorkoutTemplateExercise)
            .update({ position })
            .eq('id', row.id)
        }),
      )
    } catch (posErr) {
      // ignore position errors but surface message
      console.warn('Could not persist exercise positions', posErr)
    }

    navigate('/workout-templates')
  }

  async function handleDelete() {
    if (!id) return
    const client = getSupabaseClient()
    if (!client) return

    const { error } = await client
      .from(TableNames.WorkoutTemplate)
      .delete()
      .eq('id', id)
    if (error) {
      setStatusTone('error')
      setStatusMessage(error.message)
      return
    }

    navigate('/workout-templates')
  }

  async function handleCopy() {
    if (!id) return
    const client = getSupabaseClient()
    if (!client) return

    setStatusMessage(null)
    const { data, error } = await client
      .from(TableNames.WorkoutTemplate)
      .select('*, workout_template_exercise(*)')
      .eq('id', id)
      .single()

    if (error || !data) {
      setStatusTone('error')
      setStatusMessage(error?.message ?? 'Could not copy template')
      return
    }

    // create new template with same name + "Copy" and set current user
    const { data: authData, error: authErr } = await client.auth.getUser()

    if (authErr || !authData?.user) {
      setStatusTone('error')
      setStatusMessage('Unable to determine current user for template copy')
      return
    }

    const { data: newTemplate, error: insertError } = await client
      .from(TableNames.WorkoutTemplate)
      .insert({
        name: `${data.name} Copy`,
        description: data.description,
        user_id: authData.user.id,
      })
      .select()
      .single()

    if (insertError || !newTemplate) {
      setStatusTone('error')
      setStatusMessage(insertError?.message ?? 'Could not copy template')
      return
    }

    // copy exercises
    if (data.workout_template_exercise?.length) {
      const exerciseRows = data.workout_template_exercise.map(
        (ex: any, idx: number) => ({
          template_id: newTemplate.id,
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_name,
          position: idx,
        }),
      )
      const { error: exerciseError } = await client
        .from(TableNames.WorkoutTemplateExercise)
        .insert(exerciseRows)
      if (exerciseError) {
        setStatusTone('error')
        setStatusMessage(exerciseError.message)
        return
      }
    }

    navigate(`/workout-templates/${newTemplate.id}/edit`)
  }

  async function removeExerciseRow(rowId: string) {
    const client = getSupabaseClient()
    if (!client) return
    const { error } = await client
      .from(TableNames.WorkoutTemplateExercise)
      .delete()
      .eq('id', rowId)
    if (error) {
      setStatusTone('error')
      setStatusMessage(error.message)
      return
    }

    setStatusTone('success')
    setStatusMessage('Exercise removed')
    void loadTemplate()
  }

  function reorder<T>(
    items: T[],
    index: number,
    direction: 'up' | 'down',
  ): T[] {
    const currentIndex = index

    if (currentIndex < 0) {
      return items
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= items.length) {
      return items
    }

    const nextItems = [...items]
    const [currentItem] = nextItems.splice(currentIndex, 1)
    nextItems.splice(targetIndex, 0, currentItem)

    return nextItems
  }

  const handleReorder = (index: number, direction: 'up' | 'down') => {
    setLocalExercises((prev) => {
      const reordered = reorder(prev, index, direction)
      const movedItem = reordered[direction === 'up' ? index - 1 : index + 1]
      if (movedItem) {
        setMoved(movedItem.id)
        setTimeout(() => setMoved(null), 500)
      }
      return reordered
    })
  }

  const addExercises = async (exercises: any[]) => {
    if (!id) return
    const client = getSupabaseClient()
    if (!client) return

    const startIndex = localExercises.length
    const rows = exercises.map((ex, idx) => ({
      template_id: id,
      exercise_id: ex.id,
      exercise_name: formatLabel(ex.name) || null,
      position: startIndex + idx,
    }))

    const { error } = await client
      .from(TableNames.WorkoutTemplateExercise)
      .insert(rows)
    if (error) {
      setStatusTone('error')
      setStatusMessage(error.message)
      return
    }

    setShowExercisePicker(false)
    void loadTemplate()
  }

  return (
    <PageLayout className="max-w-4xl">
      <PageCard padding="spacious">
        <div className="flex items-start justify-between">
          <div>
            <Paragraph>Workout Templates</Paragraph>
            <Heading1 className="mt-2">Edit Template</Heading1>
          </div>
          <BackLink />
        </div>

        {loading ? (
          <p className="mt-4">Loading…</p>
        ) : !template ? (
          <p className="mt-4">Template not found.</p>
        ) : (
          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700">
              Template name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <label className="block text-sm font-medium text-slate-700 mt-3">
              Description (optional)
            </label>
            <input
              value={description ?? ''}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />

            <div className="mt-4">
              <h3 className="text-sm font-medium">Exercises</h3>
              <div className="flex items-center gap-2 mt-2">
                <Button tone="blue" onClick={() => setShowExercisePicker(true)}>
                  Add Exercises
                </Button>
                <Button tone="default" onClick={() => setLocalExercises([])}>
                  Clear Exercises
                </Button>
                <ExerciseMultiPicker
                  isOpen={showExercisePicker}
                  onSelectExercises={(exs) => addExercises(exs)}
                  onCancel={() => setShowExercisePicker(false)}
                />
              </div>

              {localExercises.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  No exercises in this template.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {localExercises.map((ex: any, idx: number) => (
                    <li
                      key={ex.id ?? `new-${idx}`}
                      className={clsx(
                        'flex flex-col gap-2 rounded-md border p-2 transition-colors sm:flex-row sm:items-center sm:justify-between',
                        {
                          'bg-blue-100': moved === ex.id,
                        },
                      )}
                    >
                      <Link
                        to={getExercisePath({
                          id: ex.exercise_id,
                          name: ex.exercise_name,
                        } as any)}
                        className="text-sm font-medium text-blue-700 underline decoration-blue-600/50 underline-offset-2 hover:text-blue-800"
                      >
                        {formatLabel(ex.exercise_name ?? ex.exercise_id)}
                      </Link>
                      <ItemControls
                        itemName={ex.exercise_name ?? ex.exercise_id}
                        onRemove={async () => {
                          if (ex.id) {
                            await removeExerciseRow(ex.id)
                          } else {
                            setLocalExercises((cur) =>
                              cur.filter((r) => r !== ex),
                            )
                          }
                        }}
                        onReorder={(direction) => handleReorder(idx, direction)}
                        isFirst={idx === 0}
                        isLast={idx === localExercises.length - 1}
                        removeText={isDesktop}
                        className="flex items-center justify-end gap-2"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {statusMessage ? (
              <p
                className={`mt-4 ${statusTone === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}
              >
                {statusMessage}
              </p>
            ) : null}

            <div className="mt-6 flex gap-2">
              <Button tone="emerald" onClick={handleSave}>
                Save
              </Button>
              {pendingDelete ? (
                <>
                  <Button tone="chip" onClick={() => setPendingDelete(false)}>
                    Cancel
                  </Button>
                  <Button
                    tone="chip-destructive"
                    onClick={async () => {
                      await handleDelete()
                    }}
                  >
                    Confirm
                  </Button>
                </>
              ) : (
                <Button tone="chip-rose" onClick={() => setPendingDelete(true)}>
                  Delete
                </Button>
              )}
              <Button
                tone="default"
                onClick={() => navigate('/workout-templates')}
              >
                Cancel
              </Button>
              <div className="ml-auto">
                <Button onClick={handleCopy} tone="blue">
                  Copy
                </Button>
              </div>
            </div>
          </div>
        )}
        {null}
      </PageCard>
    </PageLayout>
  )
}
