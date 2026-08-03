import { describe, expect, it } from 'vitest'
import { resolveExercisePageViewModel } from './exerciseView'
import { exercises, exercisesSchema } from '@gym-pilot/shared'

describe('resolveExercisePageViewModel', () => {
  it('finds the matching exercise by slug', () => {
    const parsed = exercisesSchema.parse(exercises)
    const exercise = parsed[0]

    const viewModel = resolveExercisePageViewModel(exercise.id, parsed)

    expect(viewModel.exercise?.id).toBe(exercise.id)
    expect(viewModel.mediaGif).toBe(exercise.gif_url)
  })
})
