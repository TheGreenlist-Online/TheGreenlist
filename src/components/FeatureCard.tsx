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
    <OrnatePanel className="h-full transition hover:-translate-y-0.5 hover:border-emerald-300/35" innerClassName="h-full">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/[.06] p-2 text-emerald-300">{icon}</div>
        ) : null}
        <div>
          <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
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
