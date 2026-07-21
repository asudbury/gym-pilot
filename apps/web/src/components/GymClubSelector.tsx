import { useEffect, useMemo, useState } from 'react'
import { logger } from '@gym-pilot/shared'
import {
  getFallbackVirginActiveClubs,
  loadVirginActiveClubs,
  type VirginActiveClub,
} from '../utils/virginActiveClubs'

type GymClubSelectorProps = {
  value: string
  onChange: (nextValue: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function GymClubSelector({
  value,
  onChange,
  className,
  placeholder,
  disabled = false,
}: GymClubSelectorProps) {
  const [availableClubs, setAvailableClubs] = useState<VirginActiveClub[]>(() =>
    getFallbackVirginActiveClubs(),
  )
  const [isLoadingClubs, setIsLoadingClubs] = useState(false)
  const [clubsError, setClubsError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    setIsLoadingClubs(true)
    setClubsError(null)

    void loadVirginActiveClubs()
      .then((clubs) => {
        if (!isActive) {
          return
        }

        setAvailableClubs(clubs)
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        logger.warn('[GymClubSelector] Could not load clubs', error)
        setClubsError('Could not load the club list right now.')
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingClubs(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const selectedOptionValue = useMemo(() => {
    const trimmedValue = value?.trim() ?? ''

    if (!trimmedValue) {
      return ''
    }

    const matchingClub = availableClubs.find(
      (club) =>
        String(club.clubId) === trimmedValue ||
        club.name.trim().toLowerCase() === trimmedValue.toLowerCase(),
    )

    if (matchingClub) {
      return String(matchingClub.clubId)
    }

    const fallbackClub = getFallbackVirginActiveClubs().find(
      (club) =>
        String(club.clubId) === trimmedValue ||
        club.name.trim().toLowerCase() === trimmedValue.toLowerCase(),
    )

    return fallbackClub ? String(fallbackClub.clubId) : trimmedValue
  }, [availableClubs, value])

  const handleFocus = () => {
    if (disabled) {
      return
    }

    if (availableClubs.length === 0 && !isLoadingClubs) {
      setIsLoadingClubs(true)
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled) {
      return
    }

    const rawValue = event.target.value.trim()

    if (!rawValue) {
      onChange('')
      return
    }

    onChange(rawValue)
  }

  return (
<div className="flex w-full flex-col gap-2">
  <select
    value={selectedOptionValue}
    onFocus={handleFocus}
    onChange={handleChange}
    className={`w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 ${className}`}
    disabled={disabled}
  >
    <option value="">
      {disabled
        ? 'Only available for Virgin brand'
        : (placeholder ?? 'Select a club')}
    </option>
    {availableClubs.map((club) => (
      <option key={club.clubId} value={String(club.clubId)}>
        {club.name}
      </option>
    ))}
  </select>

  {isLoadingClubs && (
    <p className="text-sm text-slate-500">Loading clubs…</p>
  )}

  {clubsError && (
    <p className="text-sm text-rose-600">{clubsError}</p>
  )}
</div>
  )
}
