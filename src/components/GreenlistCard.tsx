import { ReactNode } from 'react'

export function GreenlistCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-white/10 bg-brand-panel p-6 shadow-[0_20px_50px_rgba(0,0,0,.25)] transition hover:border-green-400/40 ${className}`}>
      {children}
    </section>
  )
}
