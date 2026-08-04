import { getAssetUrl } from '../../utils/assetUrl'

type ExerciseImageProps = {
  mediaGif?: string | null
  exerciseName: string
  className?: string
}

export function ExerciseImage({
  mediaGif,
  exerciseName,
  className,
}: ExerciseImageProps) {
  const resolvedMediaGif = mediaGif?.trim() ? mediaGif : undefined

  return (
    <div className={className ?? ''}>
      <img
        src={resolvedMediaGif ? getAssetUrl(resolvedMediaGif) : ''}
        alt={`${exerciseName} demo gif`}
        loading="lazy"
        decoding="async"
        className="h-44 rounded-xl object-contain border border-slate-200 bg-slate-50 p-1"
      />
    </div>
  )
}
