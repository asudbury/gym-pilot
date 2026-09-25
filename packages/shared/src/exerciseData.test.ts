import { describe, expect, it } from 'vitest'
import {
  exerciseLookupById,
  exercises,
  findExerciseById,
  parsedExercises,
} from './exerciseData'

describe('exerciseData', () => {
  it('reuses the parsed exercise collection as the shared exercise list', () => {
    expect(exercises).toBe(parsedExercises)
  })

  it('builds an exercise lookup by id', () => {
    const firstExercise = parsedExercises[0]

    expect(firstExercise).toBeDefined()
    expect(findExerciseById(firstExercise.id)).toEqual(firstExercise)
    expect(exerciseLookupById.get(firstExercise.id)).toEqual(firstExercise)
  })
})
