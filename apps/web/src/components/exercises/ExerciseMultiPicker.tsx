import type { Exercise } from '@gym-pilot/shared'
import { exercises, exercisesSchema } from '@gym-pilot/shared'
import { useEffect, useMemo, useState } from 'react'
import quickPickExercises from '../../constants/quickPickExercises.json'
import {
  appendRecentExerciseIds,
  readRecentExerciseIds,
  resolveFavoriteExerciseIds,
  saveRecentExerciseIds,
} from '../../features/exercises/domain/exercisePickerStorage'
import { useFavouritesFeature } from '../../features/favourites/hooks/useFavouritesFeature'
import { formatLabel } from '../../utils/formatUtils'
import { Button } from '../ui/Button'
import { DecorativeIcon } from '../ui/DecorativeIcon'
import { ExercisePickerBase } from './ExercisePickerBase'

type ExerciseSearchMultiPickerProps = {
  isOpen: boolean
  onSelectExercises: (exercises: Exercise[]) => void
  onCancel: () => void
}

function getExerciseLookup(exerciseList: Exercise[]) {
  return new Map(exerciseList.map((exercise) => [exercise.id, exercise]))
}

export function ExerciseMultiPicker({
  isOpen,
  onSelectExercises,
  onCancel,
}: ExerciseSearchMultiPickerProps) {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const [activeTab, setActiveTab] = useState<
    'recent' | 'favourites' | 'quick-picks'
  >('recent')
  const [expandedSections, setExpandedSections] = useState<{
    recent: boolean
    favourites: boolean
  }>({
    recent: true,
    favourites: true,
  })
  const [recentExerciseIds, setRecentExerciseIds] = useState<string[]>(() =>
    typeof window === 'undefined'
      ? []
      : readRecentExerciseIds(window.localStorage),
  )
  const { favorites } = useFavouritesFeature()

  const exerciseList = useMemo(() => exercisesSchema.parse(exercises), [])
  const exerciseLookup = useMemo(
    () => getExerciseLookup(exerciseList),
    [exerciseList],
  )

  const favoriteExerciseIds = useMemo(
    () => resolveFavoriteExerciseIds(exerciseList, favorites),
    [exerciseList, favorites],
  )

  const recentExercises = useMemo(
    () =>
      recentExerciseIds
        .map((exerciseId) => exerciseLookup.get(exerciseId))
        .filter((exercise): exercise is Exercise => Boolean(exercise)),
    [exerciseLookup, recentExerciseIds],
  )

  const favoriteExercises = useMemo(
    () =>
      favoriteExerciseIds
        .map((exerciseId) => exerciseLookup.get(exerciseId))
        .filter((exercise): exercise is Exercise => Boolean(exercise)),
    [exerciseLookup, favoriteExerciseIds],
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      saveRecentExerciseIds(recentExerciseIds, window.localStorage)
    }
  }, [recentExerciseIds])

  const handleToggleExercise = (exercise: Exercise) => {
    const alreadySelected = selectedExercises.some((e) => e.id === exercise.id)

    setSelectedExercises((prev) =>
      alreadySelected
        ? prev.filter((e) => e.id !== exercise.id)
        : [...prev, exercise],
    )

    if (!alreadySelected) {
      setRecentExerciseIds((current) =>
        appendRecentExerciseIds(current, [exercise.id]),
      )
    }
  }

  const handleSelectExercises = () => {
    onSelectExercises(selectedExercises)
    setRecentExerciseIds((current) =>
      appendRecentExerciseIds(
        current,
        selectedExercises.map((exercise) => exercise.id),
      ),
    )
    setSelectedExercises([])
    onCancel()
  }

  const handleCancel = () => {
    setSelectedExercises([])
    onCancel()
  }

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  const renderQuickPickGroup = (
    label: string,
    groupExercises: Exercise[],
    key: keyof typeof expandedSections,
    maxItems = 6,
  ) => {
    if (groupExercises.length === 0) {
      return null
    }

    const isExpanded = expandedSections[key]
    const visibleExercises = isExpanded
      ? groupExercises
      : groupExercises.slice(0, maxItems)
    const canExpand = groupExercises.length > maxItems

    return (
      <div className="border-b border-slate-200 p-4 last:border-b-0">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </div>
          {canExpand && (
            <button
              type="button"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
              onClick={() => toggleSection(key)}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleExercises.map((exercise) => (
            <Button
              key={exercise.id}
              tone={
                selectedExercises.some((e) => e.id === exercise.id)
                  ? 'blue'
                  : 'default'
              }
              className="px-4 py-2 text-sm"
              onClick={() => handleToggleExercise(exercise)}
            >
              {formatLabel(exercise.name)}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ExercisePickerBase
      isOpen={isOpen}
      onCancel={handleCancel}
      onSelect={handleToggleExercise}
      header={
        <div className="flex flex-col">
          {selectedExercises.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-slate-200 p-4">
              {selectedExercises.map((exercise) => (
                <span
                  key={exercise.id}
                  className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                >
                  {formatLabel(exercise.name)}
                  <button
                    type="button"
                    className="flex h-5 w-5 items-center justify-center rounded-full text-blue-500 hover:bg-blue-200 hover:text-blue-700"
                    onClick={() => handleToggleExercise(exercise)}
                  >
                    x
                  </button>
                </span>
              ))}

              <Button
                tone="emerald"
                onClick={handleSelectExercises}
                disabled={selectedExercises.length === 0}
                className="w-full"
              >
                Add {selectedExercises.length} exercise
                {selectedExercises.length === 1 ? '' : 's'}
              </Button>
            </div>
          )}

          <div className="border-b border-slate-200">
            <div className="flex gap-1 border-b border-slate-200 bg-slate-50 px-2 pt-2">
              {[
                { id: 'recent', label: 'Recent' },
                { id: 'favourites', label: 'Favourites' },
                { id: 'quick-picks', label: 'Quick picks' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`flex-none whitespace-nowrap rounded-t-md px-2 py-2 text-xs font-medium transition sm:text-sm ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'recent' &&
              renderQuickPickGroup('Recent', recentExercises, 'recent')}
            {activeTab === 'favourites' &&
              renderQuickPickGroup(
                'Favourites',
                favoriteExercises,
                'favourites',
              )}
            {activeTab === 'quick-picks' && (
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {(quickPickExercises as Exercise[]).map((category) => (
                    <Button
                      key={category.id}
                      tone={
                        selectedExercises.some((e) => e.id === category.id)
                          ? 'blue'
                          : 'default'
                      }
                      className="px-4 py-2 text-sm"
                      onClick={() => handleToggleExercise(category)}
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      }
      footer={
        <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4">
          <Button
            tone="emerald"
            onClick={handleSelectExercises}
            disabled={selectedExercises.length === 0}
            className="w-full"
          >
            Add {selectedExercises.length} exercise
            {selectedExercises.length === 1 ? '' : 's'}
          </Button>
        </div>
      }
    >
      {(suggestions, renderSuggestion, triggerPreview) => (
        <>
          {suggestions.map((exercise: Exercise) =>
            renderSuggestion(exercise, (exercise: Exercise) => (
              <div
                className="flex w-full cursor-pointer items-center"
                onClick={() => handleToggleExercise(exercise)}
              >
                <label className="flex shrink-0 items-center py-1 pr-2">
                  <input
                    type="checkbox"
                    checked={selectedExercises.some(
                      (e) => e.id === exercise.id,
                    )}
                    onChange={(e) => {
                      e.stopPropagation()
                    }}
                    className="h-5 w-5 cursor-pointer"
                  />
                </label>

                <span
                  className="ml-2 flex flex-1 items-center py-1 pl-2 font-medium text-slate-800 underline hover:text-blue-500"
                  onClick={() => triggerPreview(exercise)}
                >
                  <DecorativeIcon
                    icon="dumbbell"
                    className="mr-2 hidden h-6 w-6 text-slate-400 sm:inline-block"
                  />
                  {formatLabel(exercise.name)}
                </span>
              </div>
            )),
          )}
        </>
      )}
    </ExercisePickerBase>
  )
}
