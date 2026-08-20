import { describe, expect, it } from 'vitest'
import {
  appendRecentExerciseIds,
  normalizeExerciseIds,
} from './exercisePickerStorage'

describe('exercisePickerStorage', () => {
  it('normalizes recent ids from mixed input and removes duplicates', () => {
    expect(normalizeExerciseIds([' a ', 'b', 'a', 42, null, 'c'])).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  it('keeps the newest picks first while limiting the list size', () => {
    expect(appendRecentExerciseIds(['a', 'b'], ['c', 'a', 'd'], 3)).toEqual([
      'c',
      'a',
      'd',
    ])
  })

  // it('resolves favorite exercises from stored quick links', () => {
  //   const exercises = [
  //     { id: 'e1', name: 'Bench Press' },
  //     { id: 'e2', name: 'Squat' },
  //   ]

  //   const favorites = [
  //     { path: '/exercise/bench-press' },
  //     { path: '/exercise/other' },
  //   ]

  //   expect(resolveFavoriteExerciseIds(exercises, favorites)).toEqual(['e1'])
  // })
})
