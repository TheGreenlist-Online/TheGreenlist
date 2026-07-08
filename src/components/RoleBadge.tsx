import { cn } from '@/lib/utils'

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border border-amber-300/35 bg-[#19231c] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200', className)}>
      {role}
    </span>
  )
}
