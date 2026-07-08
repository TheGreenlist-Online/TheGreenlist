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
    <OrnatePanel className="h-full transition hover:border-emerald-300/50 hover:shadow-[0_0_28px_rgba(110,231,183,0.15)]" innerClassName="h-full">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="rounded-lg border border-amber-300/35 bg-[#1a261f]/80 p-2 text-emerald-300">{icon}</div>
        ) : null}
        <div>
          <h3 className="font-display text-xl text-amber-100">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{description}</p>
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
      className="block rounded-2xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060b08]"
    >
      {content}
    </Link>
  )
}
