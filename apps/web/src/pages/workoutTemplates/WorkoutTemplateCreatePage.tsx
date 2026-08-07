import type { Exercise, WorkoutTemplateInsert } from '@gym-pilot/shared';
import { getSupabaseClient } from '@gym-pilot/shared';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ExerciseMultiPicker } from '../../components/exercises/ExerciseMultiPicker';
import { ItemControls } from '../../components/ItemControls';
import { PageCard } from '../../components/PageCard';
import { Heading1, Paragraph } from '../../components/Typography';
import { BackLink } from '../../components/ui/BackLink';
import { Button } from '../../components/ui/Button';
import { DecorativeIcon } from '../../components/ui/DecorativeIcon';
import { StatusMessageNotification } from '../../components/ui/StatusMessageNotification';
import { PageLayout } from '../../layouts/PageLayout';
import { getExercisePath } from '../../utils/exerciseRouteUtils';
import { formatLabel } from '../../utils/formatUtils';
import { useIsDesktop } from '../../utils/useMediaQuery';

// Define a key for local storage
const LOCAL_STORAGE_KEY = 'gym-pilot-selected-template-exercises'

function WorkoutTemplateCreatePage() {
  const [selectedExercises, setSelectedExercises] = useState<
    { id: string; name: string }[]
  >(() => {
    // Initialize state from local storage
    if (typeof window !== 'undefined') {
      const savedExercises = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (savedExercises) {
        return JSON.parse(savedExercises)
      }
    }
    return []
  })
  const [moved, setMoved] = useState<string | null>(null)
  const [showExercisePicker, setShowExercisePicker] = useState(false)

  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSaveTemplate() {
    if (!templateName || selectedExercises.length === 0) {
      return
    }

    setIsSaving(true)
    try {
      const client = getSupabaseClient()

      // Ensure we set the current auth user id on the payload so the DB NOT NULL constraint is satisfied
      const { data: authData, error: authErr } = await client.auth.getUser()

      if (authErr || !authData?.user) {
        console.error(
          'Unable to determine current user for template save',
          authErr,
        )
        setIsSaving(false)
        return
      }

      const payload: WorkoutTemplateInsert = {
        name: templateName,
        description: templateDescription || null,
        metadata: {},
        user_id: authData.user.id,
      }

      const { data: insertedTemplates, error: insertError } = await client
        .from('workout_template')
        .insert(payload)
        .select('*')
        .single()

      if (insertError || !insertedTemplates) {
        setError(insertError?.message ?? 'Error inserting template')
        setIsSaving(false)
        return
      }

      const templateId = insertedTemplates.id

      const exerciseRows = selectedExercises.map((ex, idx) => ({
        template_id: templateId,
        exercise_id: ex.id,
        position: idx,
        exercise_name: formatLabel(ex.name) || null,
      }))

      const { error: exInsertErr } = await client
        .from('workout_template_exercise')
        .insert(exerciseRows)

      if (exInsertErr) {
        setError(exInsertErr.message)
        setIsSaving(false)
        return
      }

      // Clear local cached selections and navigate back
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      navigate('/workout-templates')
    } catch (err) {
      setError('Unexpected error saving template')
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (moved) {
      const timer = setTimeout(() => {
        setMoved(null)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [moved])

  // Effect to save selectedExercises to local storage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(selectedExercises))
    }
  }, [selectedExercises]) // Dependency array includes selectedExercises

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

  const addExercises = (exercises: Exercise[]) => {
    // Filter out exercises that are already selected to avoid duplicates
    const newExercises = exercises.filter(
      (newEx) =>
        !selectedExercises.some((existingEx) => existingEx.id === newEx.id),
    )
    setSelectedExercises((prev) => [...prev, ...newExercises])
  }

  const handleReorder = (index: number, direction: 'up' | 'down') => {
    setSelectedExercises((prev) => {
      const reordered = reorder(prev, index, direction)
      const movedItem = reordered[direction === 'up' ? index - 1 : index + 1]
      if (movedItem) {
        setMoved(movedItem.id)
      }
      return reordered
    })
  }

  return (
    <PageLayout className="max-w-4xl">
      <PageCard padding="spacious">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <DecorativeIcon icon="clipboard" />{' '}
            <div>
              <Paragraph>Workout Templates</Paragraph>
              <Heading1 className="mt-2">Create Template</Heading1>
            </div>
          </div>
          <BackLink />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Template name
            </label>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g. Full body - Monday"
            />
            <label className="block text-sm font-medium text-slate-700 mt-3">
              Description (optional)
            </label>
            <input
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Notes about this template"
            />
          </div>
          <div>
            <Button
              tone="blue"
              className="mr-2"
              onClick={() => setShowExercisePicker(true)}
            >
              Add Exercises
            </Button>
            <Button tone="default" onClick={() => setSelectedExercises([])}>
              Clear Exercises
            </Button>
            <ExerciseMultiPicker
              isOpen={showExercisePicker}
              onSelectExercises={(exercises) => {
                addExercises(exercises)
                setShowExercisePicker(false)
              }}
              onCancel={() => setShowExercisePicker(false)}
            />
          </div>
          <div>
            <div className="mt-4 space-y-2">
              {selectedExercises.length === 0 ? (
                <p className="text-slate-500">
                  No exercises selected yet. Add some using the "Add Exercises"
                  button.
                </p>
              ) : (
                selectedExercises.map((exercise, i) => (
                  <div
                    key={exercise.id}
                    className={clsx(
                      'flex flex-col gap-2 rounded-md border p-2 transition-colors sm:flex-row sm:items-center sm:justify-between',
                      {
                        'bg-blue-100': moved === exercise.id,
                      },
                    )}
                  >
                    <NavLink
                      to={`${getExercisePath(exercise)}?backTo=${encodeURIComponent('/workout-templates/create')}&backLabel=${encodeURIComponent('Back to Create Template')}`}
                      className="text-sm font-medium text-blue-700 underline decoration-blue-600/50 underline-offset-2 hover:text-blue-800"
                    >
                      {formatLabel(exercise.name)}
                    </NavLink>
                    <ItemControls
                      itemName={exercise.name || 'item'}
                      onRemove={() =>
                        setSelectedExercises((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      onReorder={(direction) => handleReorder(i, direction)}
                      isFirst={i === 0}
                      isLast={i === selectedExercises.length - 1}
                      removeText={isDesktop}
                      className="flex flex-wrap items-center justify-end gap-2"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {error ? (
            <StatusMessageNotification
              message={error}
              tone="error"
              className="mt-2"
            />
          ) : null}
        </div>
        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              tone="emerald"
              className="w-fit rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={handleSaveTemplate}
              disabled={
                isSaving || !templateName || selectedExercises.length === 0
              }
            >
              {isSaving ? 'Saving...' : 'Save template'}
            </Button>
            <Button
              tone="default"
              onClick={() => navigate('/workout-templates')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </PageCard>
    </PageLayout>
  )
}

export default WorkoutTemplateCreatePage
