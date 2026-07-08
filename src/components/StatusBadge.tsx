import { cn } from '@/lib/utils'

type StatusTone = 'pending' | 'under-review' | 'verified' | 'unverified' | 'resolved'

const toneClass: Record<StatusTone, string> = {
  pending: 'border-amber-300/35 text-amber-200 bg-amber-950/25',
  'under-review': 'border-sky-300/35 text-sky-200 bg-sky-950/25',
  verified: 'border-emerald-300/35 text-emerald-200 bg-emerald-950/25',
  unverified: 'border-zinc-400/35 text-zinc-300 bg-zinc-800/35',
  resolved: 'border-violet-300/35 text-violet-200 bg-violet-950/25',
}

export function StatusBadge({ status, className }: { status: StatusTone; className?: string }) {
  return (
    <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]', toneClass[status], className)}>
      {status.replace('-', ' ')}
    </span>
  )
}
