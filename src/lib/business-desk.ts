import type { SupabaseClient } from '@supabase/supabase-js'
import type { StatusTone } from '@/lib/statusTones'

/**
 * The business desk: what an operator account sees about the records it holds.
 *
 * Everything runs on the caller's session so RLS scopes it to records where
 * owner_id = auth.uid(). Each read is isolated; a failing table degrades one
 * number rather than the panel. Nothing here changes a status, and nothing
 * here can be bought: it is a view of the public record from the inside.
 */

export type DeskRecord = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  verificationStatus: string
  verificationTone: StatusTone
  isActive: boolean
  documents: { approved: number; pending: number; rejected: number }
  findings: { published: number; underReview: number }
}

export type BusinessDesk = {
  records: DeskRecord[]
  totals: { records: number; verified: number; pendingDocuments: number; openFindings: number }
  degraded: boolean
}

const VERIFICATION_TONES: Record<string, StatusTone> = {
  verified: 'success',
  approved: 'success',
  pending: 'pending',
  pending_review: 'pending',
  unverified: 'neutral',
  rejected: 'danger',
  revoked: 'danger',
}

type BusinessRow = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  verification_status: string | null
  is_active: boolean | null
}

export async function getBusinessDesk(supabase: SupabaseClient, userId: string): Promise<BusinessDesk> {
  let degraded = false

  const { data: businesses, error: bErr } = await supabase
    .from('business_profiles')
    .select('id, name, slug, city, state, verification_status, is_active')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .returns<BusinessRow[]>()

  if (bErr) {
    console.error('[business-desk] records failed:', bErr.message)
    return { records: [], totals: { records: 0, verified: 0, pendingDocuments: 0, openFindings: 0 }, degraded: true }
  }

  const rows = businesses ?? []
  if (rows.length === 0) {
    return { records: [], totals: { records: 0, verified: 0, pendingDocuments: 0, openFindings: 0 }, degraded: false }
  }

  const ids = rows.map((b) => b.id)

  const [docs, findings] = await Promise.all([
    supabase.from('business_documents').select('business_id, status').in('business_id', ids),
    supabase.from('reports').select('business_id, status').in('business_id', ids),
  ])

  if (docs.error) {
    degraded = true
    console.error('[business-desk] documents failed:', docs.error.message)
  }
  if (findings.error) {
    degraded = true
    console.error('[business-desk] reports failed:', findings.error.message)
  }

  const docIndex = new Map<string, DeskRecord['documents']>()
  for (const d of (docs.data ?? []) as Array<{ business_id: string; status: string | null }>) {
    const entry = docIndex.get(d.business_id) ?? { approved: 0, pending: 0, rejected: 0 }
    const s = (d.status ?? '').toLowerCase()
    if (s === 'approved') entry.approved += 1
    else if (s === 'rejected') entry.rejected += 1
    else entry.pending += 1
    docIndex.set(d.business_id, entry)
  }

  const findingIndex = new Map<string, DeskRecord['findings']>()
  for (const r of (findings.data ?? []) as Array<{ business_id: string; status: string | null }>) {
    const entry = findingIndex.get(r.business_id) ?? { published: 0, underReview: 0 }
    const s = (r.status ?? '').toLowerCase()
    if (s === 'published' || s === 'resolved') entry.published += 1
    else if (s === 'submitted' || s === 'under_review' || s === 'needs_more_info') entry.underReview += 1
    findingIndex.set(r.business_id, entry)
  }

  const records: DeskRecord[] = rows.map((b) => {
    const status = (b.verification_status ?? 'unverified').toLowerCase()
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      city: b.city,
      state: b.state,
      verificationStatus: status,
      verificationTone: VERIFICATION_TONES[status] ?? 'neutral',
      isActive: b.is_active ?? true,
      documents: docIndex.get(b.id) ?? { approved: 0, pending: 0, rejected: 0 },
      findings: findingIndex.get(b.id) ?? { published: 0, underReview: 0 },
    }
  })

  const totals = records.reduce(
    (acc, r) => {
      acc.records += 1
      if (r.verificationTone === 'success') acc.verified += 1
      acc.pendingDocuments += r.documents.pending
      acc.openFindings += r.findings.underReview
      return acc
    },
    { records: 0, verified: 0, pendingDocuments: 0, openFindings: 0 },
  )

  return { records, totals, degraded }
}
