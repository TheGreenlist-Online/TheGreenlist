import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionProps = {
  title: ReactNode
  /** Short scope statement or monospace meta shown at the right of the rule. */
  aside?: ReactNode
  id?: string
  className?: string
  children: ReactNode
  /** Visually hide the heading but keep it for assistive tech. */
  hideHeading?: boolean
}

/** Titled page section with the standard rule. Page bodies are a stack of these. */
export function Section({ title, aside, id, className, children, hideHeading }: SectionProps) {
  return (
    <section id={id} className={cn('gl-section', className)} aria-label={hideHeading && typeof title === 'string' ? title : undefined}>
      {hideHeading ? null : (
        <div className="gl-section__head">
          <h2>{title}</h2>
          {aside ? <div className="gl-meta">{aside}</div> : null}
        </div>
      )}
      {children}
    </section>
  )
}
