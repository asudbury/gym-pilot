import { Button } from '../Button'

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
      className="mt-4 inline-flex items-center gap-2 px-4 py-2"
    >
      <span aria-hidden="true" className="text-lg">
        ▶
      </span>
      <span>Search for on YouTube</span>
    </Button>
  )
}
