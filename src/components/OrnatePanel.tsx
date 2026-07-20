import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type OrnatePanelProps = {
  children: ReactNode
  className?: string
  innerClassName?: string
}

export function OrnatePanel({ children, className, innerClassName }: OrnatePanelProps) {
  return (
    <div className={cn('rounded-xl border border-white/[.09] bg-[#0d120f] shadow-[0_14px_35px_rgba(0,0,0,0.16)]', className)}>
      <div className={cn('h-full rounded-[inherit] border-t border-emerald-300/10 bg-gradient-to-br from-white/[.025] to-transparent p-6', innerClassName)}>
        {children}
      </div>
    </div>
  )
}
