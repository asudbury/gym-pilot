import { exercises, exercisesSchema } from '@gym-pilot/shared'
import { getExerciseSlug } from '../../../utils/exerciseRouteUtils'

export type ExercisePageViewModel = {
  exercise: (typeof exercises)[number] | undefined
  mediaGif: string
}

export function resolveExercisePageViewModel(
  slug: string | undefined,
  exerciseList: Array<(typeof exercises)[number]> = exercisesSchema.parse(
    exercises,
  ),
) {
  const exercise = slug
    ? exerciseList.find(
        (item) => getExerciseSlug(item) === slug || item.id === slug,
      )
    : undefined

  return {
    exercise,
    mediaGif: exercise ? exercise.gif_url : '',
  } satisfies ExercisePageViewModel
}
