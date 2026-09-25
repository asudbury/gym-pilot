import exercisesData from './data/exercises.json'
import { exercisesSchema, type Exercise } from './exerciseSchema'

const parsedExercises = exercisesSchema.parse(exercisesData)
const exerciseLookupById = new Map(parsedExercises.map((exercise) => [exercise.id, exercise]))

export { parsedExercises, exerciseLookupById }

export const exercises: Exercise[] = parsedExercises
export const exerciseData = parsedExercises

export function findExerciseById(exerciseId: string) {
  return exerciseLookupById.get(exerciseId)
}
