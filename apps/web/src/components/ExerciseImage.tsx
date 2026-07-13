type ExerciseImageProps = {
  mediaGif: string,
  exerciseName: string,
  className?: string
}

export function ExerciseImage({
  mediaGif,
  exerciseName,
  className,
}: ExerciseImageProps) {
  return (
        <div className={className ?? ''}>
          <img
            src={mediaGif.startsWith('/') ? mediaGif : `/${mediaGif}`}
            alt={`${exerciseName} demo gif`}
            className="h-72 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1"
          />
        </div>
  )
}
