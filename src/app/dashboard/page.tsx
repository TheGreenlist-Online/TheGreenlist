import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { FeatureCard } from '@/components/FeatureCard'
import { RoleBadge } from '@/components/RoleBadge'
import { TrustBadge } from '@/components/TrustBadge'
import { hasPermission, normalizePlatformRole } from '@/lib/roles'

const userCards = [
  { title: 'My Reports', body: 'Track filed reports, evidence updates, and accountability status changes.', href: '/reports' },
  { title: 'My Businesses', body: 'Monitor verified businesses and reputation shifts over time.', href: '/businesses' },
  { title: 'My Forums', body: 'Review your recent forum threads, replies, and community interactions.', href: '/forums' },
  { title: 'My Evidence', body: 'Access and organize submitted documents and supporting material.', href: '/evidence/upload' },
  { title: 'My Settings', body: 'Manage privacy posture, trust signals, and account-level controls.', href: '/dashboard/settings' },
  { title: 'My Profile', body: 'Review your profile visibility and verification status.', href: '/profile' },
]

const adminCards = [
  { title: 'Admin tools', body: 'Access moderation queues, legal escalation paths, and platform controls.', href: '/admin' },
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
  const cards = isAdmin ? [...userCards, ...adminCards] : userCards
  const userName = getUserName(profile ?? null, user.user_metadata?.full_name)

  return (
    <PageShell>
      <OrnatePanel>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Dashboard</p>
        <h1 className="mt-3 text-4xl text-amber-100">Welcome back{userName ? `, ${userName}` : ''}</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Your premium control-room for transparency reports, business reputation tracking, and community trust activity.
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

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <FeatureCard key={card.href} title={card.title} description={card.body} href={card.href} />
        ))}
      </section>

      <section className="mt-8 flex justify-center">
        <TrustBadge />
      </section>
    </PageShell>
  )
}
