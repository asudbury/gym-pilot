import { formatLabel } from '@gym-pilot/shared/src/utils'
import { Button } from './Button'

type YouTubeExerciseSearchButtonProps = {
  exerciseName: string
}

export function YouTubeExerciseSearchButton({
  exerciseName,
}: YouTubeExerciseSearchButtonProps) {
  const handleClick = () => {
    const query = encodeURIComponent(`${exerciseName} exercise tutorial`)
    const url = `https://www.youtube.com/results?search_query=${query}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Button
      tone="default"
      onClick={handleClick}
      aria-label={`Search YouTube for ${exerciseName}`}
      disabled={!exerciseName.trim()}
      className="mt-4 px-4 py-2"
    >
      Search for '{formatLabel(exerciseName)}' exercise on YouTube
    </Button>
  )
}

