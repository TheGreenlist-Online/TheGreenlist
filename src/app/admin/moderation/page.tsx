import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { AdminPageFrame } from '@/components/AdminPageFrame'
import type { ModerationQueueRow } from '@/types/moderation'
import { ModerationQueueTable } from './moderation-queue-table'

export const metadata = {
  title: 'Moderation queue - Review operations - The Green List',
}

const HIGH_RISK_LEVELS = new Set(['high', 'critical'])

export default async function AdminModerationPage() {
  const principal = await requireAdmin()

  if (!principal.user) {
    redirect('/auth/signin?callbackUrl=/admin/moderation')
  }

  if (!principal.authorized) {
    redirect('/dashboard')
  }

  const { data, error } = await principal.supabase
    .from('moderation_queue')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const items = (data ?? []) as ModerationQueueRow[]
  const hasSensitiveItems = items.some((item) => HIGH_RISK_LEVELS.has(item.risk_level))

  // NDA gate: if any visible queue item is high/critical risk (our proxy for
  // "sensitive"), require a signed NDA before rendering queue contents.
  if (hasSensitiveItems) {
    const { data: signature } = await principal.supabase
      .from('nda_signatures')
      .select('id')
      .eq('moderator_user_id', principal.user.id)
      .limit(1)
      .maybeSingle()

    if (!signature) {
      redirect('/admin/nda')
    }
  }

  return (
    <AdminPageFrame
      title="Moderation queue"
      lede="Flagged reports, discussion content, evidence files, and Learn submissions. Automated checks can flag content; a reviewer makes the decision, and it is logged."
      current="/admin/moderation"
      error={error ? `Queue could not be loaded: ${error.message}` : null}
      meta={<span>{items.length} in queue</span>}
    >
      <ModerationQueueTable initialItems={items} />
    </AdminPageFrame>
  )
}
