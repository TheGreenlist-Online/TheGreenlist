import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

type SimplePageProps = {
  title: string
  subtitle: string
  sections: {
    heading: string
    body: string
  }[]
}

export function SimplePage({ title, subtitle, sections }: SimplePageProps) {
  return (
    <div className="min-h-screen smoke-surface text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <section className="glow-border mb-10 rounded-lg p-px">
          <div className="rounded-lg bg-card/90 p-8 backdrop-blur">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-accent">
              The Green List
            </p>
            <h1 className="mb-4 text-4xl font-bold">{title}</h1>
            <p className="max-w-3xl text-muted-foreground">{subtitle}</p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.heading} className="glow-border rounded-lg p-px">
              <div className="h-full rounded-lg bg-card/80 p-6 backdrop-blur">
                <h2 className="mb-3 text-xl font-semibold">{section.heading}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{section.body}</p>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-10">
          <Link href="/" className="text-sm font-semibold text-accent hover:underline">
            Back to homepage
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
