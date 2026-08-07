import { formatLabel } from './formatUtils'

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getExerciseSlug(exercise: {
  id: string
  name?: string | null
}) {
  const label = exercise.name ?? exercise.id
  const slug = slugify(formatLabel(label))
  return slug || exercise.id
}

export function getExercisePath(exercise: {
  id: string
  name?: string | null
}) {
  return `/exercise/${getExerciseSlug(exercise)}`
}
