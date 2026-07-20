import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-h-full smoke-surface text-foreground', className)}>
      <main className="mx-auto w-full max-w-7xl px-4 py-10">{children}</main>
    </div>
  )
}
