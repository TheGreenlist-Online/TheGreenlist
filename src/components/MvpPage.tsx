
export function MvpPage({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string
  title: string
  description: string
  items: string[]
}) {
  return (
    <div className="min-h-screen smoke-surface text-foreground">
      <main className="container mx-auto px-4 py-10">
        <section className="glow-border rounded-lg p-px">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">{description}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <article key={item} className="glow-border rounded-lg p-px">
              <div className="h-full rounded-lg bg-card/80 p-5 text-sm leading-6 text-muted-foreground backdrop-blur">
                {item}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
