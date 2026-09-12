import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BadgeCheck, ExternalLink, MapPin, ShieldCheck, Star } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { VerifiedWall, type VerifiedFact } from '@/components/VerifiedWall'
import { BusinessDocumentsSection, type BusinessDocument } from '@/components/BusinessDocumentsSection'
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

function formatType(type: string | null) {
  if (!type) return 'Business'
  return type.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return { title: `${slug.replace(/-/g, ' ')} - Business Directory - The Green List` }
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
      isAdmin = hasPermission(role, 'platform:admin', isPlatformOwner)
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
      const { data: signed } = await supabase.storage
        .from('business-documents')
        .createSignedUrl(doc.file_url, 60 * 60)
      return { ...doc, file_url: signed?.signedUrl ?? doc.file_url }
    }),
  )
  const approvedDocuments = allDocuments.filter((doc) => doc.status === 'approved')

  return (
    <PageShell>
      <OrnatePanel className="district-page-intro">
        <div className="flex flex-wrap items-center gap-3">
          <p className="greenlist-eyebrow">
            {formatType(business.business_type)}
          </p>
          {business.verification_status === 'verified' ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-xs font-semibold text-emerald-200">
              <BadgeCheck className="h-3.5 w-3.5" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-500/30 bg-zinc-500/10 px-2 py-0.5 text-xs font-semibold text-zinc-300">
              Unverified
            </span>
          )}
        </div>
        <h1 className="greenlist-page-title">{business.name}</h1>
        {(business.city || business.state) ? (
          <p className="mt-3 flex items-center gap-1 text-sm text-zinc-400">
            <MapPin className="h-4 w-4" />
            {[business.city, business.state].filter(Boolean).join(', ')}
          </p>
        ) : null}
        {business.description ? (
          <p className="greenlist-page-lede">{business.description}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {business.website_url ? (
            <a
              href={business.website_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:border-emerald-300/60"
            >
              <ExternalLink className="h-4 w-4" />
              Visit website
            </a>
          ) : null}
        </div>
      </OrnatePanel>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <OrnatePanel>
          <p className="greenlist-eyebrow">Trust rating</p>
          <div className="mt-3 flex items-center gap-2 text-2xl font-semibold text-amber-300">
            <Star className="h-6 w-6 fill-current" />
            {(business.trust_rating ?? 0).toFixed(1)}
          </div>
        </OrnatePanel>
        <OrnatePanel>
          <p className="greenlist-eyebrow">Transparency score</p>
          <div className="mt-3 flex items-center gap-2 text-2xl font-semibold text-emerald-200">
            <ShieldCheck className="h-6 w-6" />
            {business.transparency_score ?? 0}
          </div>
        </OrnatePanel>
      </div>

      <OrnatePanel className="mt-8">
        <p className="greenlist-eyebrow">Profile status</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Verification</dt>
            <dd className="mt-1 text-sm text-zinc-200">{business.verification_status ?? 'unverified'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Sponsorship</dt>
            <dd className="mt-1 text-sm text-zinc-200">{business.sponsorship_status ?? 'none'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Profile claimed</dt>
            <dd className="mt-1 text-sm text-zinc-200">{business.is_claimed ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </OrnatePanel>

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
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Report linkage for this business is coming in a later phase.
        </p>
      </OrnatePanel>

      <div className="mt-10">
        <Link href="/businesses" className="text-sm font-semibold text-emerald-300 hover:underline">
          ← Back to directory
        </Link>
      </div>
    </PageShell>
  )
}
