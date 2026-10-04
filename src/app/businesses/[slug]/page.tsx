import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, MapPin } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { Ledger, LimitationsPanel, RecordHeader } from '@/components/record'
import { VerifiedWall, type VerifiedFact } from '@/components/VerifiedWall'
import { BusinessDocumentsSection, type BusinessDocument } from '@/components/BusinessDocumentsSection'
import { formatDate, humanize, recordId, recordStatus } from '@/lib/recordStatus'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizePlatformRole, hasPermission } from '@/lib/roles'

export const revalidate = 0

type BusinessRow = {
  id: string
  slug: string
  owner_id: string | null
  name: string
  business_type: string | null
  description: string | null
  website_url: string | null
  external_affiliate_url: string | null
  state: string | null
  city: string | null
  verification_status: string | null
  sponsorship_status: string | null
  transparency_score: number | null
  trust_rating: number | null
  is_claimed: boolean
  created_at: string
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return { title: `${slug.replace(/-/g, ' ')} — Business record` }
}

export default async function BusinessDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  const { data: business } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle<BusinessRow>()

  if (!business) notFound()

  const {
    data: { user: requester },
  } = await supabase.auth.getUser()

  let isOwner = false
  let isAdmin = false
  if (requester) {
    isOwner = requester.id === business.owner_id
    if (!isOwner) {
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', requester.id)
        .maybeSingle<{ role: string | null }>()
      const role = normalizePlatformRole(requesterProfile?.role)
      const isPlatformOwner = requester.app_metadata?.platform_owner === true
      isAdmin = hasPermission(role, 'platform.admin', isPlatformOwner)
    }
  }
  const isOwnerOrAdmin = isOwner || isAdmin

  const { data: verifiedFactsData } = await supabase
    .from('verified_facts')
    .select('id, fact_text, category, source_url, verified_at')
    .eq('subject_business_id', business.id)
    .order('verified_at', { ascending: false })
    .returns<VerifiedFact[]>()
  const verifiedFacts = verifiedFactsData ?? []

  let documentsQuery = supabase
    .from('business_documents')
    .select('id, title, doc_type, file_url, status, review_note, created_at')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  if (!isOwnerOrAdmin) {
    documentsQuery = documentsQuery.eq('status', 'approved')
  }

  const { data: documentsData } = await documentsQuery.returns<BusinessDocument[]>()
  const rawDocuments = documentsData ?? []

  // file_url stores a private storage path (business-documents bucket); resolve
  // short-lived signed URLs here so the client only ever sees a working link.
  const allDocuments = await Promise.all(
    rawDocuments.map(async (doc) => {
      if (doc.file_url.includes('..')) {
        throw new Error('Invalid file path')
      }
      const { data: signed } = await supabase.storage
        .from('business-documents')
        .createSignedUrl(doc.file_url, 60 * 60)
      return { ...doc, file_url: signed?.signedUrl ?? doc.file_url }
    }),
  )
  const approvedDocuments = allDocuments.filter((doc) => doc.status === 'approved')

  const verification = (business.verification_status ?? 'unverified').toLowerCase()
  const status = recordStatus(
    verification === 'unverified' && business.is_claimed ? 'business-reported' : verification,
  )
  const jurisdiction = business.state ?? 'Jurisdiction not stated'

  return (
    <PageShell width="record">
      <RecordHeader
        eyebrow="Records"
        kind="Business record"
        recordId={recordId('BUS', business.id)}
        jurisdiction={jurisdiction}
        title={business.name}
        lede={business.description ? (
          <>
            {business.description}
            {business.is_claimed ? (
              <span className="block mt-2 text-xs text-[var(--gl-text-muted)]">Description supplied by the business.</span>
            ) : null}
          </>
        ) : undefined}
        status={status}
        meta={[
          { label: 'Record type', value: humanize(business.business_type, 'Business') },
          { label: 'Record opened', value: formatDate(business.created_at) },
        ]}
        actions={
          <>
            {business.website_url ? (
              <a
                href={business.website_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="greenlist-quiet-button"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Business website
              </a>
            ) : null}
            <Link href="/about/corrections" className="greenlist-quiet-button">
              Request a correction
            </Link>
          </>
        }
      >
        {(business.city || business.state) ? (
          <p className="mt-3 flex items-center gap-1 text-sm text-[var(--gl-text-secondary)]">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {[business.city, business.state].filter(Boolean).join(', ')}
          </p>
        ) : null}
      </RecordHeader>

      <Ledger
        title="Documentation ledger"
        aside={`Record opened ${formatDate(business.created_at)}`}
        className="mt-8"
        rows={[
          {
            label: 'Identity verification',
            value: status.label,
            note: verification === 'verified'
              ? 'Licence and registration details were matched to an official source. This is not a judgement of product quality, safety, or conduct.'
              : 'Licence and registration details have not been matched to an official source.',
          },
          { label: 'Record claimed by business', value: business.is_claimed ? 'Yes' : 'No' },
          { label: 'Documents on file (reviewed)', value: approvedDocuments.length },
          { label: 'Facts confirmed by reviewers', value: verifiedFacts.length },
          {
            label: 'Paid relationship',
            value: business.sponsorship_status && business.sponsorship_status !== 'none'
              ? `Disclosed: ${business.sponsorship_status}`
              : 'None',
          },
          { label: 'Official enforcement records', value: 'Not yet checked in reviewed sources' },
        ]}
      />

      <LimitationsPanel subject="business" className="mt-6" />

      <div className="mt-8">
        <VerifiedWall facts={verifiedFacts} />
      </div>

      <div className="mt-8">
        <BusinessDocumentsSection
          businessId={business.id}
          slug={business.slug}
          approvedDocs={approvedDocuments}
          ownDocs={isOwnerOrAdmin ? allDocuments : []}
          isOwner={isOwner}
        />
      </div>

      <OrnatePanel className="mt-8">
        <p className="greenlist-eyebrow">Related reports</p>
        <p className="mt-2 text-sm leading-6 text-[var(--gl-text-secondary)]">
          Published findings concerning this business will be listed here. None are linked at this time.
        </p>
      </OrnatePanel>

      <div className="mt-10">
        <Link href="/businesses" className="text-sm text-[var(--gl-text-secondary)] hover:text-[var(--gl-text)] hover:underline">
          ← All business records
        </Link>
      </div>
    </PageShell>
  )
}
