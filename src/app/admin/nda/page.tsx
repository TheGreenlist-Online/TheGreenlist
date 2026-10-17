import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { AdminPageFrame } from '@/components/AdminPageFrame'
import { Ledger, Panel, StatusLabel } from '@/components/record'
import { formatDate } from '@/lib/recordStatus'
import { NDA_DOCUMENT_VERSION, type NdaSignatureRow } from '@/types/moderation'
import { NdaSignForm } from './nda-sign-form'

export const metadata = {
  title: 'Confidentiality agreement - Review operations - The Green List',
}

export default async function AdminNdaPage() {
  const principal = await requireAdmin()

  if (!principal.user) {
    redirect('/auth/signin?callbackUrl=/admin/nda')
  }

  if (!principal.authorized) {
    redirect('/dashboard')
  }

  const { data } = await principal.supabase
    .from('nda_signatures')
    .select('*')
    .eq('moderator_user_id', principal.user.id)
    .order('signed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const signature = (data ?? null) as NdaSignatureRow | null

  return (
    <AdminPageFrame
      title="Confidentiality agreement"
      lede="Reviewing sensitive reports, private evidence, or restricted discussion content requires a signed confidentiality agreement scoped to your reviewer access."
      current="/admin/nda"
      meta={<span>Document version {NDA_DOCUMENT_VERSION}</span>}
    >
      {signature ? (
        <Ledger
          title="Agreement on file"
          aside={<StatusLabel label="Signed" tone="confirmed" />}
          rows={[
            { label: 'Document version', value: signature.document_version },
            { label: 'Signed', value: formatDate(signature.signed_at, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) },
            { label: 'Effect', value: 'Sensitive review content is unlocked for your account while you hold reviewer access.' },
          ]}
        />
      ) : (
        <Panel title="Confidentiality statement" aside={<span>Read in full before signing</span>}>
          <div className="gl-prose max-h-96 overflow-y-auto border border-[var(--gl-border)] bg-[var(--gl-ink)] p-4 text-sm">
            <p>
              As a reviewer or administrator of The Green List, you may be granted access to sensitive reports, uploaded evidence,
              personally identifying details, and other restricted content (&ldquo;Confidential Material&rdquo;) submitted by members of the
              public, some of whom rely on anonymity or confidentiality for their safety.
            </p>
            <p>By signing this agreement, you acknowledge and agree that you will:</p>
            <ul className="list-disc pl-5">
              <li>Access Confidential Material solely to perform legitimate review, moderation, or safety duties.</li>
              <li>Never copy, forward, screenshot, or otherwise disclose Confidential Material to any person or system outside the platform&rsquo;s authorised review tooling.</li>
              <li>Never attempt to identify, contact, or take adverse action against an anonymous or confidential reporter based on information obtained through your access.</li>
              <li>Report any accidental disclosure or suspected data breach to platform administrators immediately.</li>
              <li>Understand that violation of this agreement may result in immediate removal of reviewer access and other consequences under platform policy and applicable law.</li>
            </ul>
            <p>
              This agreement (document version {NDA_DOCUMENT_VERSION}) remains in effect for as long as you hold reviewer or administrator
              access. Your acceptance, document version, and timestamp are recorded.
            </p>
          </div>
          <div className="mt-6">
            <NdaSignForm />
          </div>
        </Panel>
      )}
    </AdminPageFrame>
  )
}
