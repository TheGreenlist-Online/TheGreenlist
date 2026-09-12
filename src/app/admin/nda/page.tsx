import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { NDA_DOCUMENT_VERSION, type NdaSignatureRow } from '@/types/moderation'
import { NdaSignForm } from './nda-sign-form'
import { ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Confidentiality Agreement - Admin',
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
    .eq('user_id', principal.user.id)
    .order('signed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const signature = (data ?? null) as NdaSignatureRow | null

  return (
    <PageShell>
      <OrnatePanel>
        <p className="greenlist-eyebrow">Confidentiality</p>
        <h1 className="greenlist-page-title">Non-disclosure agreement</h1>
        <p className="greenlist-page-lede">
          Reviewing sensitive reports, private evidence, or restricted forum content requires a signed
          confidentiality agreement scoped to your moderator/admin access on The Green List.
        </p>
      </OrnatePanel>

      {signature ? (
        <OrnatePanel className="mt-8">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/[.06] p-2 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="greenlist-card-title">Agreement signed</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                You signed document version <span className="font-semibold text-zinc-200">{signature.document_version}</span> on{' '}
                <span className="font-semibold text-zinc-200">{new Date(signature.signed_at).toLocaleString()}</span>.
                Sensitive moderation content is unlocked for your account.
              </p>
            </div>
          </div>
        </OrnatePanel>
      ) : (
        <OrnatePanel className="mt-8">
          <h2 className="greenlist-card-title">Confidentiality statement</h2>
          <div className="mt-4 max-h-96 space-y-4 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-zinc-300">
            <p>
              As a moderator or administrator of The Green List, you may be granted access to sensitive user
              reports, uploaded evidence, personally identifying details, and other restricted content
              (&ldquo;Confidential Material&rdquo;) submitted by community members, some of whom rely on anonymity or
              confidentiality for their safety.
            </p>
            <p>By signing this agreement, you acknowledge and agree that you will:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Access Confidential Material solely to perform legitimate moderation, review, or safety duties.</li>
              <li>Never copy, forward, screenshot, or otherwise disclose Confidential Material to any person or
                system outside of the platform&rsquo;s authorized moderation tooling.</li>
              <li>Never attempt to identify, contact, or take adverse action against an anonymous or confidential
                reporter based on information obtained through your access.</li>
              <li>Report any accidental disclosure or suspected data breach to platform administrators immediately.</li>
              <li>Understand that violation of this agreement may result in immediate removal of moderator/admin
                access and other consequences as outlined in platform policy and applicable law.</li>
            </ul>
            <p>
              This agreement (document version {NDA_DOCUMENT_VERSION}) remains in effect for as long as you hold
              moderator or administrator access. Your acceptance, timestamp, and originating IP address will be
              recorded for compliance purposes.
            </p>
          </div>

          <div className="mt-6">
            <NdaSignForm />
          </div>
        </OrnatePanel>
      )}
    </PageShell>
  )
}
