import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { DistrictLabel } from '@/components/DistrictLabel'

type PageIntroProps = {
  title: ReactNode
  /** Short standfirst under the title. State what the page holds, not a slogan. */
  lede?: ReactNode
  /** Replaces the section name in the eyebrow (e.g. 'Review operations'). */
  eyebrow?: string
  /** Buttons, filters or links rendered under the lede. */
  actions?: ReactNode
  /**
   * Record metadata row — jurisdiction, record type, ID, last-reviewed date.
   * Rendered in monospace above the title so it reads as a file header.
   */
  meta?: ReactNode
  /** Anything else that belongs inside the intro block. */
  children?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

/**
 * The single page header used across the site — public and authenticated alike.
 *
 * It is deliberately not a card. A records page opens like a document: a
 * section label, a title, a plain statement of scope, then a rule. Pages pass
 * content and the shell decides how it looks.
 */
export function PageIntro({
  title,
  lede,
  eyebrow,
  actions,
  meta,
  children,
  align = 'left',
  className,
}: PageIntroProps) {
  return (
    <header
      className={cn(
        'district-page-intro border-b border-[var(--gl-border)] pb-8',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {meta ? <div className={cn('gl-meta mb-3', align === 'center' && 'justify-center')}>{meta}</div> : null}
      <DistrictLabel override={eyebrow} />
      <h1 className="greenlist-page-title">{title}</h1>
      {lede ? <p className={cn('greenlist-page-lede', align === 'center' && 'mx-auto')}>{lede}</p> : null}
      {actions ? (
        <div className={cn('greenlist-page-actions', align === 'center' && 'justify-center')}>{actions}</div>
      ) : null}
      {children}
    </header>
  )
}
