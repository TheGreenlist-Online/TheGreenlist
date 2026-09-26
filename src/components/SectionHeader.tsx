export function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className="mb-6 border-b border-[var(--gl-border)] pb-4">
      <p className="greenlist-eyebrow">{eyebrow}</p>
      <h2 className="greenlist-section-title">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-sm text-[var(--gl-text-secondary)]">{description}</p>}
    </header>
  )
}
