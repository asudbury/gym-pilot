// apps/web/src/components/navigation/HomeButton.tsx

import { NavLink } from 'react-router-dom'
import { Button } from '../ui/Button'
import { DecorativeIcon } from '../ui/DecorativeIcon'
import { NavigationMenuItem } from './NavigationMenuItem'

type HomeButtonProps = {
  variant: 'desktop' | 'tablet' | 'mobile'
  onToggleMobileMenu?: () => void
}

export function HomeButton({ variant, onToggleMobileMenu }: HomeButtonProps) {
  if (variant === 'desktop') {
    return (
      <NavigationMenuItem
        to="/"
        onClick={onToggleMobileMenu}
        className="px-2 py-1.5 text-sm font-medium"
        icon="home"
      >
        Home
      </NavigationMenuItem>
    )
  }

  if (variant === 'tablet') {
    return (
      <Button
        as={NavLink}
        to="/"
        tone="default"
        className="inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-medium mr-2"
      >
        <DecorativeIcon icon="home" className="h-4 w-4" />
        Home
      </Button>
    )
  }

  if (variant === 'mobile') {
    return (
      <Button
        as={NavLink}
        to="/"
        tone="default"
        className="inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-medium mr-2"
      >
        <DecorativeIcon icon="home" className="h-4 w-4" />
      </Button>
    )
  }

  return null
}
