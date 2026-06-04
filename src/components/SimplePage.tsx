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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <section className="mb-10 rounded-lg border bg-card p-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
            THEBLACKLIST.ONLINE
          </p>
          <h1 className="mb-4 text-4xl font-bold">{title}</h1>
          <p className="max-w-3xl text-muted-foreground">{subtitle}</p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.heading} className="rounded-lg border bg-card p-6">
              <h2 className="mb-3 text-xl font-semibold">{section.heading}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{section.body}</p>
            </article>
          ))}
        </section>

        <div className="mt-10">
          <Link href="/" className="text-sm font-semibold text-accent hover:underline">
            ← Back to homepage
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
