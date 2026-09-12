import { cn } from '@/lib/utils'
import { statusBadgeBase, statusToneClass, type StatusTone } from '@/lib/statusTones'

type StatusLabel = 'pending' | 'under-review' | 'verified' | 'unverified' | 'resolved'

const LABEL_TONES: Record<StatusLabel, StatusTone> = {
  pending: 'pending',
  'under-review': 'progress',
  verified: 'success',
  unverified: 'neutral',
  resolved: 'success',
}

export function StatusBadge({ status, className }: { status: StatusLabel; className?: string }) {
  return (
    <span className={cn(statusBadgeBase, statusToneClass[LABEL_TONES[status]], className)}>
      {status.replace(/-/g, ' ')}
    </span>
  )
}
