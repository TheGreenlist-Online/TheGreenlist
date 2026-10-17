import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PanelProps = {
  title?: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** Render the title as h3 (when nested under an h2 section). */
  level?: 2 | 3
  id?: string
}

/** Standard panel with an optional head row. All page content sits in one of these. */
export function Panel({ title, aside, children, className, bodyClassName, level = 2, id }: PanelProps) {
  const Heading = level === 2 ? 'h2' : 'h3'
  return (
    <section id={id} className={cn('gl-panel', className)}>
      {title || aside ? (
        <div className="gl-panel__head">
          {title ? <Heading>{title}</Heading> : <span />}
          {aside ? <span className="gl-meta">{aside}</span> : null}
        </div>
      ) : null}
      <div className={cn('gl-panel__body', bodyClassName)}>{children}</div>
    </section>
  )
}
