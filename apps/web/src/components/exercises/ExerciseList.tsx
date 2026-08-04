import type { exercises } from '@gym-pilot/shared'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getExercisePath } from '../../utils/exerciseRouteUtils'
import { ExerciseListItem } from './ExerciseListItem'
type ExerciseListItemType = (typeof exercises)[number]

type ExerciseListProps = {
  exercises: ExerciseListItemType[]
  isLargeScreen: boolean
  showExerciseImages: boolean
  copiedId: string | null
  isExerciseFavorite?: (exerciseId: string) => boolean
  onToggleFavoriteExercise?: (exerciseId: string) => void
  onCopyUrl: (exerciseId: string) => Promise<void>
}

export function ExerciseList({
  exercises,
  isLargeScreen,
  showExerciseImages,
  copiedId,
  isExerciseFavorite,
  onToggleFavoriteExercise,
  onCopyUrl,
}: ExerciseListProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(720)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const exerciseRows = useMemo(() => {
    const columns = isLargeScreen ? 3 : 1
    const rows: Array<
      Array<{ exercise: ExerciseListItemType; position: number }>
    > = []

    for (let index = 0; index < exercises.length; index += columns) {
      const rowItems = exercises.slice(index, index + columns)
      rows.push(
        rowItems.map((exercise, rowIndex) => ({
          exercise,
          position: index + rowIndex + 1,
        })),
      )
    }

    return rows
  }, [exercises, isLargeScreen])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const updateViewportHeight = () => {
      const nextHeight = Math.min(window.innerHeight - 280, 900)
      setViewportHeight(Math.max(nextHeight, 420))
    }

    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)

    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [])

  const rowHeight = showExerciseImages ? 340 : 170
  const overscanRows = 2
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscanRows)
  const endRow = Math.min(
    exerciseRows.length,
    startRow + Math.ceil(viewportHeight / rowHeight) + overscanRows * 2,
  )
  const visibleRows = exerciseRows.slice(startRow, endRow)

  return (
    <div className="overflow-hidden rounded-2xl">
      <style>
        {'.exercise-list-scroll::-webkit-scrollbar { display: none; }'}
      </style>
      <div
        ref={scrollContainerRef}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        className="exercise-list-scroll overflow-y-auto"
        style={{
          maxHeight: `${viewportHeight}px`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div
          style={{
            height: `${exerciseRows.length * rowHeight}px`,
            position: 'relative',
          }}
        >
          <div
            style={{
              transform: `translateY(${startRow * rowHeight}px)`,
            }}
            className="flex flex-col gap-3"
          >
            {visibleRows.map((row, rowIndex) => (
              <div
                key={`exercise-row-${startRow + rowIndex}`}
                className={
                  showExerciseImages
                    ? `grid items-start gap-3 md:gap-4 ${isLargeScreen ? 'xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2' : 'grid-cols-1'}`
                    : `grid items-start gap-1 md:gap-1.5 ${isLargeScreen ? 'xl:grid-cols-3 lg:grid-cols-3 md:grid-cols-2' : 'grid-cols-1'}`
                }
              >
                {row.map(({ exercise, position }) => (
                  <ExerciseListItem
                    key={exercise.id}
                    exercise={exercise}
                    position={position}
                    showExerciseImages={showExerciseImages}
                    isExerciseFavorite={isExerciseFavorite}
                    copiedId={copiedId ?? ''}
                    onToggleFavoriteExercise={onToggleFavoriteExercise!}
                    onCopyUrl={onCopyUrl}
                    getExercisePath={getExercisePath}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
