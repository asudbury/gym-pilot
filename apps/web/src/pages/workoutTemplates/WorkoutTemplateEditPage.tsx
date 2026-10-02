import type {
  Exercise,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from '@gym-pilot/shared'
import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ExerciseMultiPicker } from '../../components/exercises/ExerciseMultiPicker'
import { ItemControls } from '../../components/ItemControls'
import { PageCard } from '../../components/PageCard'
import { Heading1, Paragraph } from '../../components/Typography'
import { BackLink } from '../../components/ui/BackLink'
import { Button } from '../../components/ui/Button'
import { PageLayout } from '../../layouts/PageLayout'
import { getExercisePath } from '../../utils/exerciseRouteUtils'
import { formatLabel } from '../../utils/formatUtils'
import { useIsDesktop } from '../../utils/useMediaQuery'
import { reorder } from '../../utils/arrayUtils'
import {
  addExercisesToTemplate,
  copyWorkoutTemplate,
  deleteWorkoutTemplate,
  loadWorkoutTemplate,
  removeTemplateExercise,
  saveWorkoutTemplate,
} from '../../features/workoutTemplates/services/workoutTemplatesService'

export default function WorkoutTemplateEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [localExercises, setLocalExercises] = useState<
    WorkoutTemplateExercise[]
  >([])
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [moved, setMoved] = useState<string | null>(null)
  const isDesktop = useIsDesktop()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<'info' | 'error' | 'success'>(
    'info',
  )
  const [pendingDelete, setPendingDelete] = useState(false)

  async function refreshTemplate() {
    if (!id) return
    setLoading(true)
    const { data, error } = await loadWorkoutTemplate(id)
    if (error || !data) {
      setTemplate(null)
      setLoading(false)
      return
    }
    setTemplate(data)
    setName(data.name ?? '')
    setDescription(data.description ?? '')
    setLocalExercises(data.workout_template_exercise)
    setLoading(false)
  }

  useEffect(() => {
    void refreshTemplate()
  }, [id])

  async function handleSave() {
    if (!id) return
    setStatusMessage(null)
    const { error } = await saveWorkoutTemplate(
      id,
      name,
      description,
      localExercises,
    )
    if (error) {
      setStatusTone('error')
      setStatusMessage(error)
      return
    }
    navigate('/workout-templates')
  }

  async function handleDelete() {
    if (!id) return
    const { error } = await deleteWorkoutTemplate(id)
    if (error) {
      setStatusTone('error')
      setStatusMessage(error)
      return
    }
    navigate('/workout-templates')
  }

  async function handleCopy() {
    if (!id) return
    setStatusMessage(null)
    const { newTemplateId, error } = await copyWorkoutTemplate(id)
    if (error || !newTemplateId) {
      setStatusTone('error')
      setStatusMessage(error ?? 'Could not copy template')
      return
    }
    navigate(`/workout-templates/${newTemplateId}/edit`)
  }

  async function handleRemoveExercise(rowId: string) {
    const { error } = await removeTemplateExercise(rowId)
    if (error) {
      setStatusTone('error')
      setStatusMessage(error)
      return
    }
    setStatusTone('success')
    setStatusMessage('Exercise removed')
    void refreshTemplate()
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

  const addExercises = async (exercises: Exercise[]) => {
    if (!id) return
    const { error } = await addExercisesToTemplate(
      id,
      exercises,
      localExercises.length,
    )
    if (error) {
      setStatusTone('error')
      setStatusMessage(error)
      return
    }
    setShowExercisePicker(false)
    void refreshTemplate()
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
                  {localExercises.map((ex, idx) => (
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
                        })}
                        className="text-sm font-medium text-blue-700 underline decoration-blue-600/50 underline-offset-2 hover:text-blue-800"
                      >
                        {formatLabel(ex.exercise_name ?? ex.exercise_id)}
                      </Link>
                      <ItemControls
                        itemName={ex.exercise_name ?? ex.exercise_id}
                        onRemove={async () => {
                          if (ex.id) {
                            await handleRemoveExercise(ex.id)
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
