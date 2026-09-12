import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { FeatureCard } from '@/components/FeatureCard'
import { RoleBadge } from '@/components/RoleBadge'
import { TrustBadge } from '@/components/TrustBadge'
import { hasPermission, normalizePlatformRole, type PlatformRole } from '@/lib/roles'
import { statusBadgeBase, toneClass, type StatusTone } from '@/lib/statusTones'
import { getDashboardData } from '@/lib/dashboard'
import { StatTile } from '@/components/dashboard/StatTile'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { ActivityList } from '@/components/dashboard/ActivityList'
import { NotificationList } from '@/components/dashboard/NotificationList'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your reports, submissions, notifications and workspace tools.',
}

/**
 * The dashboard is the first screen after sign-in.
 *
 * It used to be three rows of static link cards — the same nine links for
 * everyone, with no information about the account looking at them. It now leads
 * with what the user actually needs: what they filed, what a reviewer is still
 * holding, what changed since they last looked, and the four actions they came
 * to perform. Role-specific tooling follows underneath.
 */

/** The actions people come to the dashboard to perform, in order of use. */
const quickActions = [
  { label: 'File a report', href: '/reports/new', primary: true },
  { label: 'Upload evidence', href: '/evidence/upload' },
  { label: 'Submit a resource', href: '/education/new' },
  { label: 'Start a discussion', href: '/forums/new' },
]

const personalCards = [
  {
    title: 'Business directory',
    body: 'Look up verified businesses, check their accountability record, or start a claim on your own listing.',
    href: '/businesses',
  },
  {
    title: 'Claim a business',
    body: 'Provide the identity and authorization details required to verify a business you represent.',
    href: '/businesses/claim',
  },
  {
    title: 'Published reports',
    body: 'Read the accountability reports that have completed review and been published.',
    href: '/reports',
  },
]

const businessCards = [
  {
    title: 'Business workspace',
    body: 'Review the public directory and the profile attached to your verified account.',
    href: '/businesses',
  },
  {
    title: 'Business verification',
    body: 'Check the documentation and authorization requirements for a verified profile.',
    href: '/businesses/claim',
  },
  {
    title: 'Reports & responses',
    body: 'Read published reports before preparing a factual business response.',
    href: '/reports',
  },
]

const moderatorCards = [
  {
    title: 'Moderation queue',
    body: 'Work through flagged reports and community content using your moderation permissions.',
    href: '/admin/moderation',
  },
  {
    title: 'Published reports',
    body: 'Private evidence requires a report-specific signed NDA before access is granted.',
    href: '/reports',
  },
  { title: 'Community forums', body: 'Review discussions across the community forums.', href: '/forums' },
]

const adminCards = [
  {
    title: 'Admin command center',
    body: 'Moderation, review, submissions, sources and audit tooling in one place.',
    href: '/admin',
  },
  {
    title: 'Evidence review queue',
    body: 'Review private evidence and report context under administrator access controls.',
    href: '/admin/review',
  },
  {
    title: 'Submission queue',
    body: 'Clear pending reports, educational resources and other submissions.',
    href: '/admin/submissions',
  },
  { title: 'Moderation queue', body: 'Handle flagged reports and community content.', href: '/admin/moderation' },
  { title: 'Audit logs', body: 'Review protected operational and role-management events.', href: '/admin/audit-logs' },
]

type DashboardProfile = {
  role: string | null
  display_name: string | null
  username: string | null
  account_status: string | null
}

const ACCOUNT_STATUS_TONES: Record<string, StatusTone> = {
  active: 'success',
  warned: 'pending',
  silenced: 'danger',
  restricted: 'danger',
  suspended: 'critical',
  banned: 'critical',
}

function getUserName(profile: DashboardProfile | null, fallbackName: unknown) {
  if (profile?.display_name) return profile.display_name
  if (profile?.username) return profile.username
  if (typeof fallbackName === 'string' && fallbackName.trim()) return fallbackName.trim()
  return ''
}

function getWorkspaceCards(role: PlatformRole, isAdmin: boolean) {
  if (isAdmin) return adminCards
  if (role === 'MODERATOR') return moderatorCards
  if (hasPermission(role, 'business:manage')) return businessCards
  return personalCards
}

function getWorkspaceTitle(role: PlatformRole, isAdmin: boolean, isPlatformOwner: boolean) {
  if (isPlatformOwner) return 'Platform owner tools'
  if (isAdmin) return 'Administrator tools'
  if (role === 'MODERATOR') return 'Moderator tools'
  if (hasPermission(role, 'business:manage')) return 'Business tools'
  return 'Explore the platform'
}

function getWorkspaceDescription(role: PlatformRole, isAdmin: boolean, isPlatformOwner: boolean) {
  if (isPlatformOwner)
    return 'Owner authority is held in server-managed account metadata and cannot be self-assigned.'
  if (isAdmin) return 'Private evidence review, moderation, submissions and audited platform operations.'
  if (role === 'MODERATOR')
    return 'Private evidence stays unavailable until you have signed an NDA scoped to that specific report.'
  if (hasPermission(role, 'business:manage'))
    return 'Profile management, report awareness and factual accountability responses.'
  return 'Where to go next beyond your own submissions.'
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?callbackUrl=/dashboard')
  }

  const [{ data: profile }, data] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, display_name, username, account_status')
      .eq('id', user.id)
      .maybeSingle<DashboardProfile>(),
    getDashboardData(supabase, user.id),
  ])

  const role = normalizePlatformRole(profile?.role)
  const isPlatformOwner = user.app_metadata?.platform_owner === true
  const isAdmin = hasPermission(role, 'platform:admin', isPlatformOwner)
  const workspaceCards = getWorkspaceCards(role, isAdmin)
  const userName = getUserName(profile ?? null, user.user_metadata?.full_name)
  const accountStatus = profile?.account_status ?? 'active'
  const { counts, activity, notifications } = data

  const needsAttention = counts.reportsAwaitingReview + counts.submissionsAwaitingReview + counts.unreadNotifications

  return (
    <PageShell>
      <PageIntro
        eyebrow="Dashboard"
        title={`Welcome back${userName ? `, ${userName}` : ''}`}
        lede={
          needsAttention > 0
            ? `You have ${needsAttention} ${needsAttention === 1 ? 'item' : 'items'} needing a look — details below.`
            : 'Everything you have filed is up to date. Nothing is waiting on you.'
        }
        actions={
          <>
            <RoleBadge role={role} />
            {accountStatus !== 'active' ? (
              <span className={`${statusBadgeBase} ${toneClass(ACCOUNT_STATUS_TONES[accountStatus])}`}>
                {accountStatus.replace(/_/g, ' ')}
              </span>
            ) : null}
            {user.email ? <span className="text-sm text-zinc-400">{user.email}</span> : null}
          </>
        }
      >
        {/* The four things people come here to do, above everything else. */}
        <div className="mt-6 flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={action.primary ? 'greenlist-primary-button' : 'greenlist-quiet-button'}
            >
              {action.label}
            </Link>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
          <Link href="/settings" className="text-zinc-400 transition hover:text-emerald-300">
            Account settings
          </Link>
          {profile?.username ? (
            <Link href={`/profile/${profile.username}`} className="text-zinc-400 transition hover:text-emerald-300">
              View public profile
            </Link>
          ) : null}
          <Link href="/help" className="text-zinc-400 transition hover:text-emerald-300">
            Get help
          </Link>
        </div>
      </PageIntro>

      {data.degraded ? (
        <p className="mt-6 rounded-lg border border-amber-300/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
          Some of your activity could not be loaded just now. The counts below may be incomplete — refresh to try again.
        </p>
      ) : null}

      <section className="mt-8" aria-label="Your activity at a glance">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="My reports"
            value={counts.reports}
            href="/reports"
            note={
              counts.reportsAwaitingReview > 0
                ? `${counts.reportsAwaitingReview} awaiting review`
                : counts.reports > 0
                  ? 'All reviewed'
                  : 'None filed yet'
            }
            emphasis={counts.reportsAwaitingReview > 0}
          />
          <StatTile
            label="My submissions"
            value={counts.submissions}
            href="/education"
            note={
              counts.submissionsAwaitingReview > 0
                ? `${counts.submissionsAwaitingReview} awaiting review`
                : counts.submissions > 0
                  ? 'All reviewed'
                  : 'None submitted yet'
            }
            emphasis={counts.submissionsAwaitingReview > 0}
          />
          <StatTile
            label="Discussions"
            value={counts.discussions}
            href="/forums"
            note={counts.discussions > 0 ? 'Threads you started' : 'None started yet'}
          />
          <StatTile
            label="Notifications"
            value={counts.unreadNotifications}
            href="/dashboard#notifications"
            note={counts.unreadNotifications > 0 ? 'Unread' : 'Nothing unread'}
            emphasis={counts.unreadNotifications > 0}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <DashboardPanel
          title="Your recent activity"
          action={counts.reports > 0 ? { label: 'All reports', href: '/reports' } : undefined}
          isEmpty={activity.length === 0}
          emptyTitle="Nothing filed yet"
          emptyBody="Reports, resources and discussions you submit will appear here with the status a reviewer has put them in."
          emptyAction={{ label: 'File your first report', href: '/reports/new' }}
        >
          <ActivityList items={activity} />
        </DashboardPanel>

        <div id="notifications" className="scroll-mt-28">
          <DashboardPanel
            title="Notifications"
            isEmpty={notifications.length === 0}
            emptyTitle="No notifications"
            emptyBody="Status changes on your reports and replies to your discussions will show up here."
          >
            <NotificationList items={notifications} />
          </DashboardPanel>
        </div>
      </div>

      {counts.openTickets > 0 ? (
        <section className="mt-6">
          <Link
            href="/contact"
            className="block rounded-xl border border-amber-300/30 bg-amber-950/20 p-5 transition hover:border-amber-300/50"
          >
            <p className="text-sm font-semibold text-amber-100">
              {counts.openTickets} open support {counts.openTickets === 1 ? 'ticket' : 'tickets'}
            </p>
            <p className="mt-1 text-sm text-amber-200/75">Check the status of your conversation with the support team.</p>
          </Link>
        </section>
      ) : null}

      <section className="mt-10">
        <p className="greenlist-eyebrow">{isPlatformOwner ? 'Platform owner' : role.toLowerCase().replace(/_/g, ' ')}</p>
        <h2 className="greenlist-section-title">{getWorkspaceTitle(role, isAdmin, isPlatformOwner)}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          {getWorkspaceDescription(role, isAdmin, isPlatformOwner)}
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {workspaceCards.map((card) => (
            <FeatureCard key={card.href} title={card.title} description={card.body} href={card.href} />
          ))}
        </div>
      </section>

      <section className="mt-10 flex justify-center">
        <TrustBadge />
      </section>
    </PageShell>
  )
}
