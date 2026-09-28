import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ShellTone } from '@/lib/statusTones'

type NoticeProps = {
  tone?: ShellTone | 'info'
  title?: ReactNode
  children: ReactNode
  className?: string
  role?: 'alert' | 'status' | 'note'
}

/** Inline notice: errors, confirmations, scope statements. Text first, one left rule. */
export function Notice({ tone = 'info', title, children, className, role }: NoticeProps) {
  return (
    <div className={cn('gl-notice', `gl-notice--${tone}`, className)} role={role ?? (tone === 'alert' ? 'alert' : undefined)}>
      {title ? <strong className="block mb-1">{title}</strong> : null}
      {children}
    </div>
  )
}
