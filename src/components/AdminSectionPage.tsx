import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { FeatureCard } from '@/components/FeatureCard'
import { RoleBadge } from '@/components/RoleBadge'

export async function AdminSectionPage({ title, description }: { title: string; description: string }) {
  const principal = await requireAdmin()

  if (!principal.user) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  if (!principal.authorized) {
    redirect('/dashboard')
  }

  return (
    <PageShell>
      <OrnatePanel>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Admin command center</p>
        <h1 className="mt-3 text-4xl text-amber-100">{title}</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">{description}</p>
        <div className="mt-5">
          <RoleBadge role="ADMIN" />
        </div>
      </OrnatePanel>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[
          ['Review queue', '/admin/review', 'Review pending reports, evidence, and escalations.'],
          ['News', '/admin/news', 'Manage editorial updates and legal-safe publishing state.'],
          ['Sources', '/admin/sources', 'Audit source credibility and verification metadata.'],
          ['Moderation', '/admin/moderation', 'Inspect flags, safety issues, and due-process actions.'],
          ['Submissions', '/admin/submissions', 'Evaluate incoming community submissions and intake quality.'],
          ['Logs', '/admin/logs', 'Track operational events and moderation audit records.'],
        ].map(([label, href, cardDescription]) => (
          <FeatureCard key={href} title={label} href={href} description={cardDescription} />
        ))}
      </section>

      <section className="mt-8 text-center">
        <Link href="/dashboard" className="text-sm font-semibold text-emerald-300 hover:underline">
          Back to dashboard
        </Link>
      </section>
    </PageShell>
  )
}
