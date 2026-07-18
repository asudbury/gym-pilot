import type { ReactNode } from 'react'
import { getToneClass, type ToneName } from '../toneClasses'

export type BadgeTone = ToneName

type InfoPillProps = {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

export function InfoPill({
  children,
  tone = 'default',
  className,
}: InfoPillProps) {
  const toneClassName = getToneClass(tone, className)
  return (
    <span className={toneClassName.replace('cursor-pointer ', '')}>
      {children}
    </span>
  )
}

type ExerciseMetaBadgesProps = {
  values: string[]
  tones?: BadgeTone[]
  className?: string
  pillClassName?: string
}

export function ExerciseMetaBadges({
  values,
  tones,
  className,
  pillClassName,
}: ExerciseMetaBadgesProps) {
  return (
    <div
      className={['flex flex-wrap gap-2', className].filter(Boolean).join(' ')}
    >
      {values.map((value, index) => (
        <InfoPill
          key={`${value}-${index}`}
          tone={tones?.[index] ?? 'default'}
          className={pillClassName}
        >
          {value}
        </InfoPill>
      ))}
    </div>
  )
}
