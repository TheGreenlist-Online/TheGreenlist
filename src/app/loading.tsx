export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[var(--gl-content-width)] px-4 pb-16 pt-10 md:px-6 md:pt-12">
      <p role="status" aria-live="polite" className="font-mono text-sm text-[var(--gl-text-muted)]">
        Loading records…
      </p>
    </main>
  )
}
