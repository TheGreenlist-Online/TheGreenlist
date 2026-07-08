import { ReactNode } from 'react'
import { SiteHeader } from '@/components/SiteHeader'
import { Footer } from '@/components/Footer'

export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen smoke-surface text-foreground ${className}`.trim()}>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10">{children}</main>
      <Footer />
    </div>
  )
}
