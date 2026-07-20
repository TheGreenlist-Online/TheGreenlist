import { ReactNode } from 'react'

interface GreenlistPageTemplateProps {
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
}

/**
 * Shared visual foundation for Greenlist pages.
 * Keeps every route inside the same transparency-network design language.
 */
export function GreenlistPageTemplate({
  eyebrow = 'The Greenlist',
  title,
  description,
  children,
}: GreenlistPageTemplateProps) {
  return (
    <section className="greenlist-template-bg min-h-screen py-12">
      <header className="mx-auto mb-10 w-full max-w-5xl px-4">
        <p className="greenlist-kicker">{eyebrow}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-400">
            {description}
          </p>
        )}
      </header>
      <main className="mx-auto w-full max-w-5xl px-4">{children}</main>
    </section>
  )
}
