export function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className="mb-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{title}</h2>
      {description && <p className="mt-3 max-w-2xl text-slate-400">{description}</p>}
    </header>
  )
}
