import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageShellProps = {
  children: ReactNode
  className?: string
  /**
   * Three sanctioned widths, so pages never feel like unrelated microsites.
   * `wide` (1200px) for tables and dashboards, `record` (960px) for record
   * detail, `reading` (760px) for long-form methodology and learning.
   */
  width?: 'wide' | 'record' | 'reading'
}

const widthClass: Record<NonNullable<PageShellProps['width']>, string> = {
  wide: 'max-w-[var(--gl-content-width)]',
  record: 'max-w-[var(--gl-record-width)]',
  reading: 'max-w-[var(--gl-reading-width)]',
}

export function PageShell({ children, className = '', width = 'wide' }: PageShellProps) {
  return (
    <div className={cn('min-h-full text-foreground', className)}>
      <main className={cn('mx-auto w-full px-4 pb-16 pt-10 md:px-6 md:pt-12', widthClass[width])}>{children}</main>
    </div>
  )
}
