import { ReactNode } from 'react'
import { OrnatePanel } from '@/components/OrnatePanel'

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
    <section id={id} className="scroll-mt-28">
      <OrnatePanel>
        <div className="max-w-2xl">
          <h2 className="greenlist-section-title">{title}</h2>
          {description ? <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p> : null}
        </div>

        <div className="mt-6 space-y-5">{children}</div>

        {footer ? <div className="mt-6 border-t border-white/[.07] pt-5">{footer}</div> : null}
      </OrnatePanel>
    </section>
  )
}
