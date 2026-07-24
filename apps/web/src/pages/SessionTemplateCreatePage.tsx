import { useState } from 'react'
import { PageLayout } from '../layouts/PageLayout'
import { PageCard } from '../components/PageCard'
import { Heading1, Paragraph } from '../components/Typography'
import { DecorativeIcon } from '../components/ui/DecorativeIcon'
import { BackLink } from '../components/ui/BackLink'
import { Button } from '../components/ui/Button'
import type { Exercise } from '@gym-pilot/shared'
import { useNavigate } from 'react-router-dom'
import { MobileExerciseSearchPicker } from '../components/exercises/MobileExerciseSearchPicker'

function SessionTemplateCreatePage() {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const navigate = useNavigate()

  function reorder<T extends { id: string }>(
    items: T[],
    itemId: string,
    direction: 'up' | 'down',
  ): T[] {
    const currentIndex = items.findIndex((item) => item.id === itemId)

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

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises((prev) => [...prev, exercise])
  }

  const removeExercise = (exercise: Exercise) => {
    setSelectedExercises((prev) => prev.filter((e) => e.id !== exercise.id))
  }

  const handleReorder = (exerciseId: string, direction: 'up' | 'down') => {
    setSelectedExercises((prev) => reorder(prev, exerciseId, direction))
  }

  return (
    <PageLayout className="max-w-4xl">
      <PageCard padding="spacious">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <DecorativeIcon icon="clipboard" />{' '}
            <div>
              <Paragraph>Session Templates</Paragraph>
              <Heading1 className="mt-2">Create Workout Template</Heading1>
            </div>
          </div>
          <BackLink to="/session-templates" label="Back to Templates" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6">
          <div>
            <div className="mt-4 space-y-2">
              <MobileExerciseSearchPicker
                onSelectExercise={(exercise) => {
                  addExercise(exercise)
                }}
              />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Selected Exercises</h2>
            <div className="mt-4 space-y-2">
              {selectedExercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <span>{exercise.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleReorder(exercise.id, 'up')}
                      disabled={index === 0}
                      aria-label="Move up"
                    >
                      ↑
                    </Button>
                    <Button
                      onClick={() => handleReorder(exercise.id, 'down')}
                      disabled={index === selectedExercises.length - 1}
                      aria-label="Move down"
                    >
                      ↓
                    </Button>
                    <Button onClick={() => removeExercise(exercise)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              tone="emerald"
              className="w-fit rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={() => navigate('/session-templates')}
            >
              Save template
            </Button>
            <Button
              type="button"
              tone="default"
              onClick={() => navigate('/session-templates')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </PageCard>
    </PageLayout>
  )
}

export default SessionTemplateCreatePage
