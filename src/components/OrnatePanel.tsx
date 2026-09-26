import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type OrnatePanelProps = {
  children: ReactNode
  className?: string
  innerClassName?: string
}

/**
 * The standard content panel. Despite the historical name there is nothing
 * ornate about it: one border, one flat surface, 24px padding. Every card and
 * intro panel on the site is built from this so surfaces cannot drift.
 */
export function OrnatePanel({ children, className, innerClassName }: OrnatePanelProps) {
  return (
    <div className={cn('gl-panel', className)}>
      <div className={cn('h-full gl-panel__body', innerClassName)}>{children}</div>
    </div>
  )
}

export { OrnatePanel as Panel }
