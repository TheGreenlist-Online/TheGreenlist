import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { LimitationsPanel, Notice, Panel, RecordList, RecordRow, Section, StatusLabel } from '@/components/record'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentPrincipal } from '@/lib/supabase/authz'
import { isAdmin } from '@/lib/roles'
import { PageIntro } from '@/components/PageIntro'

export const metadata = {
  title: 'Evidence Desk - The Green List',
  description: 'Public discussion attached to records, sources, and open documentation requests.',
}

type ForumRow = {
  id: string
  slug: string
  name: string
  description: string | null
  category: string | null
  accent_color: string | null
  is_active: boolean
  is_sensitive: boolean
  requires_auth: boolean
  created_at: string
}

function formatCategory(category: string | null) {
  if (!category) return 'General'
  return category
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default async function ForumsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: forums, error } = await supabase
    .from('forums')
    .select('id, slug, name, description, category, accent_color, is_active, is_sensitive, requires_auth, created_at')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })
    .returns<ForumRow[]>()

  const { role, isPlatformOwner } = await getCurrentPrincipal()
  const viewerIsAdmin = isAdmin(role, isPlatformOwner)

  const grouped = new Map<string, ForumRow[]>()
  for (const forum of forums ?? []) {
    const key = formatCategory(forum.category)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(forum)
  }

  return (
    <PageShell>
      <PageIntro
        title="Evidence Desk"
        lede="Public discussion in service of the record: locating primary documents, identifying missing records, asking informed questions, and correcting errors. Discussion does not change a record's status; documentary review does."
        meta={
          <>
            <span>{forums?.length ?? 0} desks</span>
            <span>Moderated for sourcing</span>
          </>
        }
        actions={
          <Link href="/forums/new" className="greenlist-primary-button">
            Open a discussion
          </Link>
        }
      />

      {error ? (
        <Notice tone="alert" className="mt-8">
          Desks could not be loaded. Try again shortly.
        </Notice>
      ) : grouped.size === 0 ? (
        <Panel className="mt-8">
          <p className="text-sm font-semibold text-[var(--gl-text)]">No desks open.</p>
          <p className="mt-1 text-sm leading-6 text-[var(--gl-text-secondary)]">No discussion desks have been opened yet.</p>
          {viewerIsAdmin ? (
            <div className="mt-4">
              <Link href="/admin/moderation" className="greenlist-secondary-button">
                Open the first desk
              </Link>
            </div>
          ) : null}
        </Panel>
      ) : (
        Array.from(grouped.entries()).map(([category, categoryForums]) => (
          <Section key={category} title={category} aside={<span>{categoryForums.length} desk{categoryForums.length === 1 ? '' : 's'}</span>}>
            <RecordList ariaLabel={`${category} desks`}>
              {categoryForums.map((forum) => (
                <RecordRow
                  key={forum.id}
                  href={`/forums/${forum.slug}`}
                  title={forum.name}
                  body={forum.description ?? undefined}
                  meta={
                    <>
                      <span>Discussion desk</span>
                      <span>{forum.requires_auth ? 'Sign-in required to post' : 'Public'}</span>
                    </>
                  }
                  aside={forum.is_sensitive ? <StatusLabel label="Sensitive topics" tone="review" title="Posts in this desk are reviewed before publication" /> : undefined}
                />
              ))}
            </RecordList>
          </Section>
        ))
      )}

      <LimitationsPanel subject="discussion" className="mt-10" />
    </PageShell>
  )
}
