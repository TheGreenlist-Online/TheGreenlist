import Link from 'next/link'
import { ReactNode } from 'react'
import { OrnatePanel } from '@/components/OrnatePanel'

type FeatureCardProps = {
  title: string
  description: string
  href?: string
  icon?: ReactNode
}

export function FeatureCard({ title, description, href, icon }: FeatureCardProps) {
  const content = (
    <OrnatePanel className="h-full transition-colors hover:border-[var(--gl-border-strong)]" innerClassName="h-full">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="border border-[var(--gl-border)] p-2 text-[var(--gl-text-secondary)]">{icon}</div>
        ) : null}
        <div>
          <h3 className="greenlist-card-title">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--gl-text-secondary)]">{description}</p>
        </div>
      </div>
    </OrnatePanel>
  )

  if (!href) {
    return content
  }

  return (
    <Link
      href={href}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gl-accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--gl-ink)]"
    >
      {content}
    </Link>
  )
}
