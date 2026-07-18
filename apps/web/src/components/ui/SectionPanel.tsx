import type { HTMLAttributes, ReactNode } from 'react'
import { Panel } from './Panel'

type SectionPanelProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
  className?: string
}

export function SectionPanel({
  children,
  className = '',
  ...props
}: SectionPanelProps) {
  return (
    <Panel
      className={`space-y-4 ${className}`.trim()}
      variant="muted"
      padding="md"
      {...props}
    >
      {children}
    </Panel>
  )
}
