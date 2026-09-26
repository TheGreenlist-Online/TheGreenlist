import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function GreenlistCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={cn('gl-panel gl-panel__body', className)}>{children}</section>
}
