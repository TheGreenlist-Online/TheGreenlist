export function TrustBadge({ text = 'Built for Truth. Driven by Community.' }: { text?: string }) {
  return (
    <div className="inline-flex items-center rounded-full border border-amber-300/35 bg-[#121a15]/85 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
      {text}
    </div>
  )
}
