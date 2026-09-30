import { ReactNode } from 'react'

/**
 * One titled block of settings. Sections carry an id so the in-page nav can
 * jump to them, and scroll-margin so the sticky header never covers the title.
 */
export function SettingsSection({
  id,
  title,
  description,
  children,
  footer,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section id={id} className="gl-panel scroll-mt-28">
      <div className="gl-panel__head">
        <h2>{title}</h2>
      </div>
      <div className="gl-panel__body">
        {description ? <p className="mb-5 max-w-2xl text-sm leading-6 text-[var(--gl-text-secondary)]">{description}</p> : null}
        <div className="grid gap-5">{children}</div>
        {footer ? <div className="mt-6 border-t border-[var(--gl-border)] pt-5">{footer}</div> : null}
      </div>
    </section>
  )
}
