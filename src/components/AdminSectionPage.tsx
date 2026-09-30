import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
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
      <PageIntro
        eyebrow="Admin command center"
        title={title}
        lede={description}
        actions={<RoleBadge role="ADMIN" />}
      />

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[
          ['Review queue', '/admin/review', 'Review pending reports, evidence, and escalations.'],
          ['News', '/admin/news', 'Manage editorial updates and legal-safe publishing state.'],
          ['Sources', '/admin/sources', 'Audit source credibility and verification metadata.'],
          ['Moderation', '/admin/moderation', 'Inspect flags, safety issues, and due-process actions.'],
          ['Submissions', '/admin/submissions', 'Evaluate incoming community submissions and intake quality.'],
          ['Audit logs', '/admin/audit-logs', 'Track operational events and moderation audit records.'],
          ['NDA agreement', '/admin/nda', 'Sign the confidentiality agreement required to review sensitive content.'],
          ['Verified Wall', '/admin/verified-facts', 'Add or remove moderator-verified facts on profiles and business pages.'],
          ['Business documents', '/admin/business-documents', 'Approve or reject licenses, lab results, and permits.'],
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
