import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { UserRole } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { SignOutButton } from '@/components/dashboard/sign-out-button'

type DashboardCard = {
  title: string
  body: string
  href: string
}

const commonCards: DashboardCard[] = [
  { title: 'Quick actions', body: 'Start a report, review saved resources, or update account settings.', href: '/reports' },
  { title: 'Recent activity', body: 'Track report, forum, news, and community updates tied to your account.', href: '/profile' },
  { title: 'Saved items and bookmarks', body: 'Return to saved articles, education resources, and transparency references.', href: '/news' },
  { title: 'Settings and profile', body: 'Manage profile visibility, anonymous reporting preferences, and account details.', href: '/settings' },
]

const roleCards: Record<UserRole, DashboardCard[]> = {
  USER: [
    { title: 'Submit a report', body: 'Share a transparency concern for review without enabling commerce or transactions.', href: '/report' },
    { title: 'View my reports', body: 'Monitor submitted reports and moderation status labels.', href: '/reports' },
    { title: 'Forum/community activity', body: 'Participate in education, safety, and accountability discussions.', href: '/forums' },
    { title: 'Education/resources', body: 'Read source-linked news and civic transparency resources.', href: '/news' },
  ],
  BUSINESS: [
    { title: 'Business profile status', body: 'Review transparency profile status, verification, and admin approval state.', href: '/businesses' },
    { title: 'Claim/manage business profile', body: 'Request corrections and provide non-commerce profile context.', href: '/businesses' },
    { title: 'Transparency score placeholder', body: 'Preview future accountability signals and documentation requirements.', href: '/profile' },
    { title: 'Submit corrections/evidence', body: 'Provide source material for moderator or legal review.', href: '/reports' },
    { title: 'Visibility controls', body: 'Tune public, private, business-visible, and admin-only profile settings.', href: '/settings' },
  ],
  CULTIVATOR: [
    { title: 'Cultivator profile', body: 'Manage informational profile details and review status.', href: '/profile' },
    { title: 'Compliance documentation', body: 'Prepare transparency documentation placeholders for review workflows.', href: '/reports' },
    { title: 'Reports involving cultivator', body: 'Review relevant allegations and status labels through due process.', href: '/reports' },
    { title: 'Educational submissions', body: 'Submit educational or source transparency material for review.', href: '/news' },
  ],
  DISTRIBUTOR: [
    { title: 'Distributor profile', body: 'Manage informational distributor profile and verification status.', href: '/profile' },
    { title: 'Supply-chain transparency', body: 'Track future documentation placeholders with no inventory or ordering.', href: '/reports' },
    { title: 'Reports involving distributor', body: 'Review report status and submit correction evidence.', href: '/reports' },
    { title: 'Compliance/resource links', body: 'Access transparency and accountability resources.', href: '/news' },
  ],
  ADMIN: [
    { title: 'User management', body: 'Review account roles, verification, and profile visibility safeguards.', href: '/admin' },
    { title: 'Business/cultivator/distributor review queue', body: 'Approve requested organization account types after human review.', href: '/admin/review' },
    { title: 'Report moderation queue', body: 'Evaluate pending, escalated, verified, unverified, and resolved reports.', href: '/admin/moderation' },
    { title: 'Forum moderation', body: 'Review community safety flags and due-process moderation notes.', href: '/admin/moderation' },
    { title: 'News/source review', body: 'Check source quality, citations, and editorial status.', href: '/admin/news' },
    { title: 'Evidence review', body: 'Handle sensitive evidence and correction submissions.', href: '/admin/submissions' },
    { title: 'System health/status', body: 'Review logs, DNS/env checklist, and future n8n automation status.', href: '/admin/logs' },
  ],
  MODERATOR: [
    { title: 'Moderation queue', body: 'Review community safety signals for human-led decisions.', href: '/admin/moderation' },
  ],
  REPORTER: [
    { title: 'News/source workspace', body: 'Draft and review source-linked reporting without unsupported claims.', href: '/news' },
  ],
  EDUCATOR: [
    { title: 'Education resources', body: 'Contribute civic transparency and safety education resources.', href: '/news' },
  ],
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/dashboard')
  }

  const cards = [...commonCards, ...(roleCards[session.user.role] ?? roleCards.USER)]

  return (
    <div className="min-h-screen smoke-surface text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <section className="glow-border rounded-lg p-px">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">The Green List</p>
            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">Account dashboard</h1>
                <p className="mt-3 max-w-3xl text-muted-foreground">
                  Your transparency, reporting, education, news, forum, and community trust control center.
                </p>
              </div>
              <SignOutButton />
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">Role: {session.user.role}</span>
              <span className="rounded-full border border-accent/20 px-3 py-1">Verification: {session.user.verificationStatus ?? 'UNVERIFIED'}</span>
              <span className="rounded-full border border-accent/20 px-3 py-1">Visibility: {session.user.profileVisibility ?? 'PRIVATE'}</span>
              <span className="rounded-full border border-accent/20 px-3 py-1">Anonymous reports: {session.user.allowAnonymousReports ? 'Enabled' : 'Disabled'}</span>
              {session.user.email ? <span className="px-3 py-1">{session.user.email}</span> : null}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link key={`${card.href}-${card.title}`} href={card.href} className="glow-border rounded-lg p-px transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/10">
              <article className="h-full rounded-lg bg-card/85 p-5 backdrop-blur">
                <h2 className="text-lg font-semibold text-foreground">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.body}</p>
              </article>
            </Link>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  )
}
