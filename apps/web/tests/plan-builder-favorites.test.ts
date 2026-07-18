import { describe, expect, it } from 'vitest'
import { buildFavoritePlanBuilderState } from '../src/features/planBuilder/domain/planBuilderFavorites'

describe('buildFavoritePlanBuilderState', () => {
  it('returns favorite exercise ids and normalized favorite links', () => {
    const state = buildFavoritePlanBuilderState(
      {
        favorites: [
          {
            id: '1',
            label: 'Alpha',
            path: '/exercise/alpha',
            folder: '  Zeta  ',
          },
          { id: '2', label: 'Beta', path: '/exercise/beta' },
        ],
        folders: ['Alpha'],
      },
      [{ exerciseId: 'existing' }],
      [
        { id: 'exercise-1', name: 'Alpha' },
        { id: 'exercise-2', name: 'Beta' },
      ],
    )

    expect(state.favoriteExerciseIds).toEqual(['exercise-1', 'exercise-2'])
    expect(state.favoriteLinks[0].folder).toBe('Zeta')
  })
})
