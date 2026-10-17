import { ReactNode } from 'react'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'

interface GreenlistPageTemplateProps {
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
}

/** Legacy template; now delegates to the shared shell so it cannot drift. */
export function GreenlistPageTemplate({ eyebrow, title, description, children }: GreenlistPageTemplateProps) {
  return (
    <PageShell>
      <PageIntro eyebrow={eyebrow} title={title} lede={description} />
      <div className="mt-8">{children}</div>
    </PageShell>
  )
}
