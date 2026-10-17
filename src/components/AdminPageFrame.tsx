import Link from 'next/link'
import { ReactNode } from 'react'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { RoleBadge } from '@/components/RoleBadge'
import { Notice } from '@/components/record'

export const ADMIN_SECTIONS = [
  { label: 'Overview', href: '/admin' },
  { label: 'Review queue', href: '/admin/review' },
  { label: 'Business claims', href: '/admin/claims' },
  { label: 'Business documents', href: '/admin/business-documents' },
  { label: 'Submissions', href: '/admin/submissions' },
  { label: 'Moderation', href: '/admin/moderation' },
  { label: 'Confirmed facts', href: '/admin/verified-facts' },
  { label: 'News feed', href: '/admin/news' },
  { label: 'Sources', href: '/admin/sources' },
  { label: 'Audit logs', href: '/admin/audit-logs' },
  { label: 'NDA', href: '/admin/nda' },
] as const

type AdminPageFrameProps = {
  title: string
  lede: string
  /** Current pathname, used to mark the active section. */
  current: string
  role?: string
  /** Load error surfaced as a notice under the header. */
  error?: string | null
  meta?: ReactNode
  actions?: ReactNode
  children: ReactNode
}

/**
 * Standard frame for every review-operations page. Same header, same
 * section list, same error surface; pages only supply their content.
 */
export function AdminPageFrame({ title, lede, current, role = 'ADMIN', error, meta, actions, children }: AdminPageFrameProps) {
  return (
    <PageShell>
      <PageIntro
        eyebrow="Review operations"
        title={title}
        lede={lede}
        meta={
          <>
            <span>Restricted</span>
            <span>Actions are logged</span>
            {meta}
          </>
        }
        actions={
          <>
            <RoleBadge role={role} />
            {actions}
          </>
        }
      >
        <nav aria-label="Review operations sections" className="mt-5">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.06em]">
            {ADMIN_SECTIONS.map((section) => {
              const active = section.href === current
              return (
                <li key={section.href}>
                  <Link
                    href={section.href}
                    aria-current={active ? 'page' : undefined}
                    className={active ? 'border-b border-[var(--gl-accent-strong)] pb-0.5 text-[var(--gl-text)]' : 'text-[var(--gl-text-muted)] hover:text-[var(--gl-text)]'}
                  >
                    {section.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </PageIntro>

      {error ? (
        <Notice tone="alert" className="mt-6">
          {error}
        </Notice>
      ) : null}

      <div className="mt-8">{children}</div>
    </PageShell>
  )
}
