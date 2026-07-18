import { useId, useMemo, useState } from 'react'
import { loadVirginActiveClubs, type VirginActiveClub } from '../utils/virginActiveClubs'

type GymClubSelectorProps = {
  value: string
  onChange: (nextValue: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function GymClubSelector({ value, onChange, className, placeholder, disabled = false }: GymClubSelectorProps) {
  const [availableClubs, setAvailableClubs] = useState<VirginActiveClub[]>([])
  const [isLoadingClubs, setIsLoadingClubs] = useState(false)
  const [clubsError, setClubsError] = useState<string | null>(null)
  const listId = useId()

  const displayValue = useMemo(() => {
    const trimmedValue = value?.trim() ?? ''

    if (!trimmedValue) {
      return ''
    }

    const matchingClub = availableClubs.find((club) => String(club.clubId) === trimmedValue)

    return matchingClub?.name ?? trimmedValue
  }, [availableClubs, value])

  const handleFocus = async () => {
    if (disabled || availableClubs.length > 0 || isLoadingClubs) {
      return
    }

    setIsLoadingClubs(true)
    setClubsError(null)

    try {
      const clubs = await loadVirginActiveClubs()
      setAvailableClubs(clubs)
    } catch (error) {
      console.warn('[GymClubSelector] Could not load clubs', error)
      setClubsError('Could not load the club list right now.')
    } finally {
      setIsLoadingClubs(false)
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return
    }

    const rawValue = event.target.value.trim()

    if (!rawValue) {
      onChange('')
      return
    }

    const matchingClub = availableClubs.find((club) => club.name.trim().toLowerCase() === rawValue.toLowerCase())

    onChange(matchingClub ? String(matchingClub.clubId) : '')
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        value={displayValue}
        onFocus={handleFocus}
        onChange={handleChange}
        className={className}
        placeholder={disabled ? 'Only available for Virgin brand' : placeholder}
        list={listId}
        autoComplete="off"
        disabled={disabled}
      />
      <datalist id={listId}>
        {availableClubs.map((club) => (
          <option key={club.clubId} value={club.name} />
        ))}
      </datalist>
      {isLoadingClubs ? <p className="text-xs text-slate-500">Loading clubs…</p> : null}
      {clubsError ? <p className="text-xs text-rose-600">{clubsError}</p> : null}
    </div>
  )
}
