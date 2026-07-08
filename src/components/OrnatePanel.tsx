import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type OrnatePanelProps = {
  children: ReactNode
  className?: string
  innerClassName?: string
}

export function OrnatePanel({ children, className, innerClassName }: OrnatePanelProps) {
  return (
    <div className={cn('rounded-2xl border border-amber-300/35 bg-[#0b110e]/90 p-1 shadow-[0_0_0_1px_rgba(92,61,26,0.4),0_16px_50px_rgba(0,0,0,0.55)]', className)}>
      <div className={cn('rounded-xl border border-emerald-300/15 bg-gradient-to-br from-[#101712]/95 via-[#0d130f]/95 to-[#090f0c]/95 p-6', innerClassName)}>
        {children}
      </div>
    </div>
  )
}
