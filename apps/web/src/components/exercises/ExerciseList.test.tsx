import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ExerciseList } from './ExerciseList'

describe('ExerciseList', () => {
  it('renders exercises without crashing', () => {
    const exercises = [
      {
        id: 'exercise-1',
        name: 'Squat',
        category: 'Legs',
        equipment: 'Bodyweight',
        image: null,
      },
      {
        id: 'exercise-2',
        name: 'Push Up',
        category: 'Upper Body',
        equipment: 'Bodyweight',
        image: null,
      },
    ] as any

    expect(() =>
      renderToStaticMarkup(
        <MemoryRouter>
          <ExerciseList
            exercises={exercises}
            isLargeScreen={false}
            showExerciseImages={false}
            copiedId={null}
            onCopyUrl={async () => {}}
          />
        </MemoryRouter>,
      ),
    ).not.toThrow()
  })
})
