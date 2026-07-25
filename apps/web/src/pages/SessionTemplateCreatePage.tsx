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
import { ItemControls } from '../components/ItemControls'
import { useIsDesktop } from '../utils/useMediaQuery'

function SessionTemplateCreatePage() {
  const [selectedExercises, setSelectedExercises] = useState<
    { id: string; name: string }[]
  >([])

  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

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

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises((prev) => [...prev, exercise])
  }

  const handleReorder = (index: number, direction: 'up' | 'down') => {
    setSelectedExercises((prev) => reorder(prev, index, direction))
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
              {selectedExercises.map((exercise, i) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <span>{exercise.name}</span>
                  <ItemControls
                    itemName={exercise.name || "item"}
                    onRemove={() =>
                      setSelectedExercises((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                    onReorder={(direction) => handleReorder(i, direction)}
                    isFirst={i === 0}
                    isLast={i === selectedExercises.length - 1}
                    removeText={isDesktop}
                  />
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
