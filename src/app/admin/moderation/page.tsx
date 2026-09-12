import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { RoleBadge } from '@/components/RoleBadge'
import type { ModerationQueueRow } from '@/types/moderation'
import { ModerationQueueTable } from './moderation-queue-table'
import { ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'Moderation Queue - Admin',
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
      .eq('user_id', principal.user.id)
      .limit(1)
      .maybeSingle()

    if (!signature) {
      redirect('/admin/nda')
    }
  }

  return (
    <PageShell>
      <OrnatePanel>
        <p className="greenlist-eyebrow">Admin command center</p>
        <h1 className="mt-3 text-4xl text-amber-100">Moderation queue</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Review flagged reports, forum content, evidence files, and education submissions. AI can flag
          content, but admin review controls the final decision.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <RoleBadge role="ADMIN" />
          {error ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-red-300">
              <ShieldAlert className="h-4 w-4" /> Failed to load queue: {error.message}
            </span>
          ) : null}
        </div>
      </OrnatePanel>

      <section className="mt-8">
        <ModerationQueueTable initialItems={items} />
      </section>

      <section className="mt-8 text-center">
        <Link href="/admin" className="text-sm font-semibold text-emerald-300 hover:underline">
          Back to admin command center
        </Link>
      </section>
    </PageShell>
  )
}
