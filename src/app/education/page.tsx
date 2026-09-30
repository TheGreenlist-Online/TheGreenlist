import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Ledger, LimitationsPanel, Notice, Panel, RecordList, RecordRow, Section, StatusLabel } from '@/components/record'
import { EDUCATION_CATEGORIES, educationCategoryLabel } from '@/lib/educationCategories'
import { formatDate, recordId } from '@/lib/recordStatus'

export const metadata = {
  title: 'Learn - The Green List',
  description: 'Plain-language explainers on cannabis testing, labelling, licensing, and consumer rights, reviewed for sourcing before publication.',
}

type EducationListRow = {
  id: string
  category: string
  title: string
  summary: string
  created_at: string
}

export default async function EducationPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('education_resources')
    .select('id, category, title, summary, created_at')
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false })

  const activeCategory = category && Object.keys(EDUCATION_CATEGORIES).includes(category) ? category : undefined
  if (activeCategory) query = query.eq('category', activeCategory)

  const { data, error } = await query.returns<EducationListRow[]>()
  const resources = data ?? []

  return (
    <PageShell>
      <PageIntro
        title="Learn"
        lede="Plain-language explainers on how cannabis testing, labelling, and licensing work, and what a certificate of analysis does and does not tell you. Resources are reviewed for accuracy and sourcing before publication. Nothing here is medical or legal advice."
        meta={
          <>
            <span>{resources.length} published resource{resources.length === 1 ? '' : 's'}</span>
            <span>Sources listed on every resource</span>
          </>
        }
        actions={
          <Link href="/education/new" className="greenlist-primary-button">
            Submit a resource
          </Link>
        }
      />

      <Section title="Categories" aside="Filter the list">
        <Panel>
          <div className="flex flex-wrap gap-2">
            <Link href="/education" className={activeCategory ? 'greenlist-quiet-button' : 'greenlist-secondary-button'} aria-current={!activeCategory ? 'true' : undefined}>
              All
            </Link>
            {Object.entries(EDUCATION_CATEGORIES).map(([value, meta]) => (
              <Link
                key={value}
                href={`/education?category=${value}`}
                className={activeCategory === value ? 'greenlist-secondary-button' : 'greenlist-quiet-button'}
                aria-current={activeCategory === value ? 'true' : undefined}
              >
                {meta.label}
              </Link>
            ))}
          </div>
          {activeCategory ? <p className="mt-3 text-sm text-[var(--gl-text-secondary)]">{EDUCATION_CATEGORIES[activeCategory].scope}</p> : null}
        </Panel>
      </Section>

      <Section title="Published resources" aside={<span>Newest first</span>}>
        {error ? (
          <Notice tone="alert">Resources could not be loaded. Try again shortly.</Notice>
        ) : resources.length === 0 ? (
          <Panel>
            <p className="text-sm font-semibold text-[var(--gl-text)]">No published resources{activeCategory ? ' in this category' : ''}.</p>
            <p className="mt-1 text-sm leading-6 text-[var(--gl-text-secondary)]">Submitted resources are listed once reviewers have checked their sourcing and published them.</p>
          </Panel>
        ) : (
          <RecordList ariaLabel="Published resources">
            {resources.map((resource) => (
              <RecordRow
                key={resource.id}
                href={`/education/${resource.id}`}
                title={resource.title}
                body={resource.summary}
                meta={
                  <>
                    <span>{recordId('EDU', resource.id)}</span>
                    <span>{educationCategoryLabel(resource.category)}</span>
                    <span>Published {formatDate(resource.created_at)}</span>
                  </>
                }
                aside={<StatusLabel label="Reviewed" tone="confirmed" title="Reviewed for accuracy and sourcing before publication" />}
              />
            ))}
          </RecordList>
        )}
      </Section>

      <Section title="What the categories cover">
        <Ledger rows={Object.values(EDUCATION_CATEGORIES).map((meta) => ({ label: meta.label, value: meta.scope }))} />
      </Section>

      <LimitationsPanel subject="resource" />
    </PageShell>
  )
}
