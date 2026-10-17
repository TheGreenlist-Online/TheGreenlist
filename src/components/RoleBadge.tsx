import { cn } from '@/lib/utils'
import { humanize } from '@/lib/recordStatus'

/** Platform role shown as a neutral status label. A role describes permissions, not standing. */
export function RoleBadge({ role, className }: { role: string; className?: string }) {
  return <span className={cn('gl-status gl-status--neutral', className)}>{humanize(role)}</span>
}
