import { cn } from '@/lib/utils'

type ScoreMeterProps = {
  label: string
  score: number | null | undefined
  max?: number
  className?: string
}

/** Simple 0-100 (or 0-max) numeric score rendered as a labeled bar meter. */
export function ScoreMeter({ label, score, max = 100, className }: ScoreMeterProps) {
  const value = typeof score === 'number' && Number.isFinite(score) ? score : 0
  const pct = Math.max(0, Math.min(100, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-zinc-500">
        <span>{label}</span>
        <span className="font-semibold text-emerald-200">{value}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/[.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
