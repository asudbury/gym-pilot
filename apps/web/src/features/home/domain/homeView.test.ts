import { describe, expect, it } from 'vitest'
import type { exercises } from '@gym-pilot/shared'
import {
  filterExercises,
  normalizeCategory,
  resolveHomeViewModel,
} from './homeView'

type ExerciseFixture = (typeof exercises)[number]

describe('normalizeCategory', () => {
  it('returns null for empty or null categories', () => {
    expect(normalizeCategory(null)).toBeNull()
    expect(normalizeCategory('')).toBeNull()
  })
})

describe('resolveHomeViewModel', () => {
  it('builds the expected search and filter state', () => {
    const viewModel = resolveHomeViewModel({
      searchTerm: 'squat',
      selectedCategory: 'All',
      showImages: true,
    })

    expect(viewModel.categories[0]).toBe('All')
    expect(viewModel.hasExplicitAll).toBe(true)
    expect(viewModel.hasSearchText).toBe(true)
    expect(viewModel.hasSearchThreshold).toBe(true)
    expect(viewModel.shouldShowResults).toBe(true)
  })
})

describe('filterExercises', () => {
  it('filters by category and search text', () => {
    const exerciseList: ExerciseFixture[] = [
      {
        id: '1',
        name: 'Squat',
        category: 'Legs',
        body_part: 'Legs',
        equipment: 'Barbell',
        instructions: { en: 'Do the squat' },
        instruction_steps: { en: ['Step 1'] },
        muscle_group: 'Legs',
        secondary_muscles: [],
        target: 'Quads',
        image: 'image.png',
        gif_url: 'gif.png',
        media_id: 'media-1',
        created_at: '2024-01-01',
        attribution: 'Test',
      },
      {
        id: '2',
        name: 'Push Up',
        category: 'Upper',
        body_part: 'Upper',
        equipment: 'Bodyweight',
        instructions: { en: 'Do the push up' },
        instruction_steps: { en: ['Step 1'] },
        muscle_group: 'Chest',
        secondary_muscles: [],
        target: 'Chest',
        image: 'image.png',
        gif_url: 'gif.png',
        media_id: 'media-2',
        created_at: '2024-01-01',
        attribution: 'Test',
      },
    ]

    const result = filterExercises(
      exerciseList,
      { searchTerm: 'squat', selectedCategory: 'Legs', showImages: true },
      'Legs',
      false,
      'squat',
    )

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Squat')
  })
})
