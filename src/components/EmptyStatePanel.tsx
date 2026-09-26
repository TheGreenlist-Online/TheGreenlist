import { ReactNode } from 'react'
import { OrnatePanel } from '@/components/OrnatePanel'

export function EmptyStatePanel({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <OrnatePanel innerClassName="text-center">
      <h3 className="greenlist-section-title">{title}</h3>
      <p className="mt-3 text-sm text-[var(--gl-text-secondary)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </OrnatePanel>
  )
}
