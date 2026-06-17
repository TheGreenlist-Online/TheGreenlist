import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { UserRole } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const userCards = [
  { title: 'Account overview', body: 'Review your profile status, saved topics, and account activity.', href: '/profile' },
  { title: 'Submitted reports', body: 'Submit and track transparency reports with evidence, context, and review status.', href: '/reports' },
  { title: 'Community forums', body: 'Join topic-based discussions around education, safety, accountability, and news.', href: '/forums' },
  { title: 'News watch', body: 'Follow source-linked updates and briefings without sales or marketplace noise.', href: '/news' },
]

const businessCards = [
  { title: 'Organization dashboard', body: 'View transparency, reputation, and accountability placeholders for authorized organization roles.', href: '/business/dashboard' },
]

const adminCards = [
  { title: 'Review queue', body: 'Check pending reports, moderation flags, and source reviews.', href: '/admin/review' },
  { title: 'Moderation', body: 'Inspect community safety signals and admin-only moderation actions.', href: '/admin/moderation' },
  { title: 'System logs', body: 'Review automation and platform health events.', href: '/admin/logs' },
]

function normalizeRole(role: unknown): UserRole {
  return Object.values(UserRole).includes(role as UserRole) ? (role as UserRole) : UserRole.USER
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/dashboard')
  }

  const role = normalizeRole(session.user.role)
  const isAdmin = role === UserRole.ADMIN
  const canUseBusinessDashboard = [UserRole.BUSINESS, UserRole.DISTRIBUTOR, UserRole.CULTIVATOR].includes(role)
  const cards = [
    ...userCards,
    ...(canUseBusinessDashboard ? businessCards : []),
    ...(isAdmin ? [...businessCards, ...adminCards] : []),
  ]

  return (
    <div className="min-h-screen smoke-surface text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <section className="glow-border rounded-lg p-px">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Dashboard</p>
            <h1 className="mt-3 text-3xl font-bold">Welcome back{session.user.name ? `, ${session.user.name}` : ''}</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Your Green List control center for transparency reports, education, community trust, and accountability tools.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">Role: {role}</span>
              {session.user.email ? <span>{session.user.email}</span> : null}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="glow-border rounded-lg p-px transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/10">
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
