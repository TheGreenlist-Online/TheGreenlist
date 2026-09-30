import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { OrnatePanel } from '@/components/OrnatePanel'
import { DistrictLabel } from '@/components/DistrictLabel'

type PageIntroProps = {
  title: ReactNode
  /** Short standfirst under the title. */
  lede?: ReactNode
  /** Replaces the district name in the eyebrow (e.g. 'Admin command center'). */
  eyebrow?: string
  /** Buttons, filters or meta rendered under the lede. */
  actions?: ReactNode
  /** Anything else that belongs inside the intro panel. */
  children?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

/**
 * The single page header used across the site — public and authenticated alike.
 *
 * Before this existed, every page hand-rolled the same panel and there were
 * sixteen different h1 treatments in the repo, so signed-in views drifted onto
 * a gilded amber title while public pages used white. Pages now pass content
 * and the shell decides how it looks.
 */
export function PageIntro({
  title,
  lede,
  eyebrow,
  actions,
  children,
  align = 'left',
  className,
}: PageIntroProps) {
  return (
    <OrnatePanel
      className={cn('district-page-intro', className)}
      innerClassName={align === 'center' ? 'text-center' : undefined}
    >
      <DistrictLabel override={eyebrow} />
      <h1 className="greenlist-page-title">{title}</h1>
      {lede ? <p className={cn('greenlist-page-lede', align === 'center' && 'mx-auto')}>{lede}</p> : null}
      {actions ? (
        <div className={cn('greenlist-page-actions', align === 'center' && 'justify-center')}>{actions}</div>
      ) : null}
      {children}
    </OrnatePanel>
  )
}
