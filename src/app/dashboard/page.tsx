import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { RoleBadge } from '@/components/RoleBadge'
import { LimitationsPanel, Notice, RecordList, RecordRow, Section } from '@/components/record'
import {
  canReviewBusinessClaims,
  isAdmin as isAdminRole,
  isModerator,
  normalizePlatformRole,
  roleCategory,
  type PlatformRole,
} from '@/lib/roles'
import { toneClass, type StatusTone } from '@/lib/statusTones'
import { getDashboardData, getPendingClaimCount } from '@/lib/dashboard'
import { StatTile } from '@/components/dashboard/StatTile'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { ActivityList } from '@/components/dashboard/ActivityList'
import { NotificationList } from '@/components/dashboard/NotificationList'
import { SetupChecklist } from '@/components/dashboard/SetupChecklist'
import { ParticipationLimits } from '@/components/dashboard/ParticipationLimits'
import { BusinessDesk } from '@/components/dashboard/BusinessDesk'
import { getOnboardingState } from '@/lib/onboarding'
import { getDeskLimits } from '@/lib/entitlements-desk'
import { getBusinessDesk } from '@/lib/business-desk'

export const metadata: Metadata = {
  title: 'Your desk - The Green List',
  description: 'Your filings, submissions, notifications, and account tools.',
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
  { title: 'Business records', body: 'Look up a business, read its documentation ledger, or start a claim on a record you represent.', href: '/businesses' },
  { title: 'Claim a record', body: 'Provide the identity and authorisation details needed to match a record to an official source.', href: '/businesses/claim' },
  { title: 'Reports', body: 'The review states a report moves through, and the reports you have filed.', href: '/reports' },
]

const businessCards = [
  { title: 'Business records', body: 'The public record attached to your account and the records of other licensees.', href: '/businesses' },
  { title: 'Identity verification', body: 'Documentation required before a record is labelled Identity verified.', href: '/businesses/claim' },
  { title: 'Reports and responses', body: 'Published findings that name your business, and the right of reply on the record.', href: '/reports' },
]

const moderatorCards = [
  { title: 'Moderation queue', body: 'Flagged reports and public submissions awaiting a decision under your review permissions.', href: '/admin/moderation' },
  { title: 'Reports', body: 'Private evidence requires a report-specific signed NDA before access is granted.', href: '/reports' },
  { title: 'Evidence Desk', body: 'Public discussions and open documentation requests.', href: '/forums' },
]

const adminCards = [
  { title: 'Business claims', body: 'Confirm that a claimant represents the business, then accept or decline. The claimant is notified either way.', href: '/admin/claims' },
  { title: 'Review operations', body: 'Moderation, review, submissions, sources, and audit tooling.', href: '/admin' },
  { title: 'Evidence review queue', body: 'Private evidence and report context under administrator access controls.', href: '/admin/review' },
  { title: 'Submission queue', body: 'Pending reports, resources, and other submissions.', href: '/admin/submissions' },
  { title: 'Moderation queue', body: 'Flagged reports and public submissions.', href: '/admin/moderation' },
  { title: 'Audit logs', body: 'Protected operational and role-management events.', href: '/admin/audit-logs' },
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

// The workspace section is chosen by role category rather than by comparing
// role names, so adding an operator or review role does not require editing
// these three functions. ADMIN and MODERATOR share the REVIEW category but get
// different tools, so they are still distinguished within it.
function getWorkspaceCards(role: PlatformRole, isAdmin: boolean) {
  if (isAdmin) return adminCards
  if (isModerator(role)) return moderatorCards
  if (roleCategory(role) === 'OPERATOR') return businessCards
  return personalCards
}

function getWorkspaceTitle(role: PlatformRole, isAdmin: boolean, isPlatformOwner: boolean) {
  if (isPlatformOwner) return 'Platform owner tools'
  if (isAdmin) return 'Administrator tools'
  if (isModerator(role)) return 'Moderator tools'
  if (roleCategory(role) === 'OPERATOR') return 'Business tools'
  return 'Sections of the record'
}

function getWorkspaceDescription(role: PlatformRole, isAdmin: boolean, isPlatformOwner: boolean) {
  if (isPlatformOwner)
    return 'Owner authority is held in server-managed account metadata and cannot be self-assigned.'
  if (isAdmin) return 'Private evidence review, moderation, submissions and audited platform operations.'
  if (isModerator(role))
    return 'Private evidence stays unavailable until you have signed an NDA scoped to that specific report.'
  if (roleCategory(role) === 'OPERATOR')
    return 'Record management, awareness of published findings, and factual responses on the record.'
  return 'Where your submissions sit in the wider record.'
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?callbackUrl=/dashboard')
  }

  const [{ data: profile }, data, onboarding, limits] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, display_name, username, account_status')
      .eq('id', user.id)
      .maybeSingle<DashboardProfile>(),
    getDashboardData(supabase, user.id),
    getOnboardingState(supabase, user.id),
    getDeskLimits(supabase),
  ])

  const role = normalizePlatformRole(profile?.role)
  const isPlatformOwner = user.app_metadata?.platform_owner === true
  const isAdmin = isAdminRole(role, isPlatformOwner)
  const isOperator = roleCategory(role) === 'OPERATOR'
  // Business records are only fetched for accounts that can hold them.
  const businessDesk = isOperator ? await getBusinessDesk(supabase, user.id) : null

  // Reviewer workload, not personal activity — only fetched for people who can act on it.
  // Gated on the permission that names the action, not on being an admin.
  const canReviewClaims = canReviewBusinessClaims(role, isPlatformOwner)
  const pendingClaims = canReviewClaims ? await getPendingClaimCount() : null
  const workspaceCards = getWorkspaceCards(role, isAdmin)
  const userName = getUserName(profile ?? null, user.user_metadata?.full_name)
  const accountStatus = profile?.account_status ?? 'active'
  const { counts, activity, notifications } = data

  const needsAttention = counts.reportsAwaitingReview + counts.submissionsAwaitingReview + counts.unreadNotifications

  return (
    <PageShell>
      <PageIntro
        eyebrow="Account"
        title={userName ? `${userName}: your desk` : 'Your desk'}
        lede={
          needsAttention > 0
            ? `${needsAttention} ${needsAttention === 1 ? 'item requires' : 'items require'} your attention. Details below.`
            : 'All filings are current. Nothing is awaiting your action.'
        }
        meta={
          <>
            <span>{isPlatformOwner ? 'Platform owner' : role.replace(/_/g, ' ')}</span>
            {user.email ? <span>{user.email}</span> : null}
          </>
        }
        actions={
          <>
            <RoleBadge role={isPlatformOwner ? 'platform owner' : role} />
            {accountStatus !== 'active' ? <span className={toneClass(ACCOUNT_STATUS_TONES[accountStatus])}>{accountStatus.replace(/_/g, ' ')}</span> : null}
          </>
        }
      >
        <div className="mt-6 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className={action.primary ? 'greenlist-primary-button' : 'greenlist-quiet-button'}>
              {action.label}
            </Link>
          ))}
        </div>

        <div className="gl-meta mt-4">
          <Link href="/settings" className="gl-link">
            Account settings
          </Link>
          {profile?.username ? (
            <Link href={`/profile/${profile.username}`} className="gl-link">
              Public profile
            </Link>
          ) : null}
          <Link href="/help" className="gl-link">
            Help
          </Link>
        </div>
      </PageIntro>

      {data.degraded ? (
        <Notice tone="review" className="mt-6">
          Some of your activity could not be loaded. The counts below may be incomplete; refresh to try again.
        </Notice>
      ) : null}

      {!onboarding.completed && onboarding.available ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <SetupChecklist state={onboarding} />
          <ParticipationLimits limits={limits} />
        </div>
      ) : null}

      {businessDesk ? (
        <div className="mt-8">
          <BusinessDesk desk={businessDesk} />
        </div>
      ) : null}

      <section className="mt-8" aria-label="Your activity at a glance">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Your reports"
            value={counts.reports}
            href="/reports"
            note={counts.reportsAwaitingReview > 0 ? `${counts.reportsAwaitingReview} awaiting review` : counts.reports > 0 ? 'All reviewed' : 'None filed'}
            emphasis={counts.reportsAwaitingReview > 0}
          />
          <StatTile
            label="Your submissions"
            value={counts.submissions}
            href="/education"
            note={counts.submissionsAwaitingReview > 0 ? `${counts.submissionsAwaitingReview} awaiting review` : counts.submissions > 0 ? 'All reviewed' : 'None submitted'}
            emphasis={counts.submissionsAwaitingReview > 0}
          />
          <StatTile label="Discussions" value={counts.discussions} href="/forums" note={counts.discussions > 0 ? 'Discussions you opened' : 'None opened'} />
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
          title="Your recent filings"
          action={counts.reports > 0 ? { label: 'All reports', href: '/reports' } : undefined}
          isEmpty={activity.length === 0}
          emptyTitle="Nothing filed"
          emptyBody="Reports, resources, and discussions you submit are listed here with the review state a reviewer has put them in."
          emptyAction={{ label: 'File a report', href: '/reports/new' }}
        >
          <ActivityList items={activity} />
        </DashboardPanel>

        <div className="grid gap-6">
          <div id="notifications" className="scroll-mt-28">
            <DashboardPanel title="Notifications" isEmpty={notifications.length === 0} emptyTitle="No notifications" emptyBody="Status changes on your reports and replies to your discussions are listed here.">
              <NotificationList items={notifications} />
            </DashboardPanel>
          </div>
          {onboarding.completed || !onboarding.available ? <ParticipationLimits limits={limits} /> : null}
        </div>
      </div>

      {pendingClaims && pendingClaims > 0 ? (
        <Notice tone="review" className="mt-6">
          <strong>
            {pendingClaims} business {pendingClaims === 1 ? 'claim' : 'claims'} awaiting review.
          </strong>{' '}
          <Link href="/admin/claims" className="gl-link">
            Open the claims queue
          </Link>
          . The claimant is notified of either outcome.
        </Notice>
      ) : null}

      {counts.openTickets > 0 ? (
        <Notice tone="info" className="mt-6">
          <strong>
            {counts.openTickets} open support {counts.openTickets === 1 ? 'request' : 'requests'}.
          </strong>{' '}
          <Link href="/contact" className="gl-link">
            Check status
          </Link>
        </Notice>
      ) : null}

      <Section title={getWorkspaceTitle(role, isAdmin, isPlatformOwner)} aside={<span>{getWorkspaceDescription(role, isAdmin, isPlatformOwner)}</span>}>
        <RecordList ariaLabel={getWorkspaceTitle(role, isAdmin, isPlatformOwner)}>
          {workspaceCards.map((card) => (
            <RecordRow key={card.href} href={card.href} title={card.title} body={card.body} />
          ))}
        </RecordList>
      </Section>

      <LimitationsPanel subject="profile" />
    </PageShell>
  )
}
