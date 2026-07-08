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
    <OrnatePanel className="border-emerald-300/25" innerClassName="text-center">
      <h3 className="font-display text-xl text-amber-100">{title}</h3>
      <p className="mt-3 text-sm text-zinc-300">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </OrnatePanel>
  )
}
