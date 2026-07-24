import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { FeatureCard } from '@/components/FeatureCard'
import { RoleBadge } from '@/components/RoleBadge'
import { TrustBadge } from '@/components/TrustBadge'
import { hasPermission, normalizePlatformRole, type PlatformRole } from '@/lib/roles'

const submissionCards = [
  { title: 'Submit a Report & Evidence', body: 'Create a report or add private photos, receipts, screenshots, labels, PDFs, and supporting documents.', href: '/evidence/upload' },
  { title: 'Submit an Education Resource', body: 'Send a safety guide, regulatory resource, research summary, or worker-rights resource for review.', href: '/education/new' },
  { title: 'Start a Forum Discussion', body: 'Open the community discussion area and begin a moderated conversation.', href: '/forums/new' },
]

const personalCards = [
  { title: 'My Reports', body: 'Track filed reports, evidence updates, and accountability status changes.', href: '/reports' },
  { title: 'Business Directory', body: 'Review verified businesses or begin a business-claim request.', href: '/businesses' },
  { title: 'Claim a Business', body: 'Provide the business identity and authorization information required for verification.', href: '/businesses/claim' },
]

const businessCards = [
  { title: 'Business Workspace', body: 'Review the public business directory and the profile associated with your verified account.', href: '/businesses' },
  { title: 'Business Verification', body: 'Review the documentation and authorization requirements for a verified business profile.', href: '/businesses/claim' },
  { title: 'Reports & Responses', body: 'Review published accountability reports before preparing a factual business response.', href: '/reports' },
]

const moderatorCards = [
  { title: 'Published Reports', body: 'Review published reports. Private evidence requires a report-specific signed NDA before access is granted.', href: '/reports' },
  { title: 'Community Forums', body: 'Review community discussions using your moderation permissions.', href: '/forums' },
]

const adminCards = [
  { title: 'Admin Command Center', body: 'Access protected moderation, review, submissions, sources, and audit tools.', href: '/admin' },
  { title: 'Evidence Review Queue', body: 'Review private evidence and report context under administrator access controls.', href: '/admin/review' },
  { title: 'Submission Queue', body: 'Review reports, educational resources, and other pending submissions.', href: '/admin/submissions' },
  { title: 'Moderation Queue', body: 'Handle flagged reports and community content.', href: '/admin/moderation' },
  { title: 'Audit Logs', body: 'Review protected operational and role-management events.', href: '/admin/logs' },
]

type DashboardProfile = {
  role: string | null
  display_name: string | null
}

function getUserName(profile: DashboardProfile | null, fallbackName: unknown) {
  if (profile?.display_name) {
    return profile.display_name
  }

  if (typeof fallbackName === 'string' && fallbackName.trim()) {
    return fallbackName.trim()
  }

  return ''
}

function getWorkspaceCards(role: PlatformRole, isAdmin: boolean) {
  if (isAdmin) return adminCards
  if (role === 'MODERATOR') return moderatorCards
  if (hasPermission(role, 'business:manage')) return businessCards
  return personalCards
}

function getWorkspaceDescription(role: PlatformRole, isAdmin: boolean, isPlatformOwner: boolean) {
  if (isPlatformOwner) return 'Protected platform-owner workspace. Owner authority is held in server-managed account metadata and cannot be self-assigned.'
  if (isAdmin) return 'Administrator workspace for private evidence review, moderation, submissions, and audited platform operations.'
  if (role === 'MODERATOR') return 'Moderator workspace. Private evidence remains unavailable until the moderator has signed an NDA scoped to that specific report.'
  if (hasPermission(role, 'business:manage')) return 'Verified business workspace for profile management, report awareness, and factual accountability responses.'
  return 'Personal workspace for reports, evidence, education submissions, discussions, and business verification requests.'
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?callbackUrl=/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .maybeSingle<DashboardProfile>()

  const role = normalizePlatformRole(profile?.role)
  const isPlatformOwner = user.app_metadata?.platform_owner === true
  const isAdmin = hasPermission(role, 'platform:admin', isPlatformOwner)
  const workspaceCards = getWorkspaceCards(role, isAdmin)
  const userName = getUserName(profile ?? null, user.user_metadata?.full_name)

  return (
    <PageShell>
      <OrnatePanel>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Dashboard</p>
        <h1 className="mt-3 text-4xl text-amber-100">Welcome back{userName ? `, ${userName}` : ''}</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">
          {getWorkspaceDescription(role, isAdmin, isPlatformOwner)}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <RoleBadge role={role} />
          {user.email ? <span className="text-sm text-zinc-400">{user.email}</span> : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/settings" className="rounded-lg border border-amber-300/35 px-4 py-2 text-sm text-amber-100 transition hover:border-emerald-300 hover:text-emerald-200">
            Settings
          </Link>
          <Link href="/dashboard/preferences" className="rounded-lg border border-amber-300/35 px-4 py-2 text-sm text-amber-100 transition hover:border-emerald-300 hover:text-emerald-200">
            Preferences
          </Link>
        </div>
      </OrnatePanel>

      <section className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Create & submit</p>
        <h2 className="mt-2 text-2xl text-amber-100">Send content to the correct review path</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {submissionCards.map((card) => (
            <FeatureCard key={card.href} title={card.title} description={card.body} href={card.href} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Role workspace</p>
        <h2 className="mt-2 text-2xl text-amber-100">{isPlatformOwner ? 'Platform owner' : role.toLowerCase().replace('_', ' ')}</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {workspaceCards.map((card) => (
          <FeatureCard key={card.href} title={card.title} description={card.body} href={card.href} />
          ))}
        </div>
      </section>

      <section className="mt-8 flex justify-center">
        <TrustBadge />
      </section>
    </PageShell>
  )
}
