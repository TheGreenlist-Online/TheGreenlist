import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { LimitationsPanel, Panel, RecordHeader, SourceCard } from '@/components/record'
import { educationCategoryLabel } from '@/lib/educationCategories'
import { formatDate, recordId } from '@/lib/recordStatus'

type EducationDetailRow = {
  id: string
  category: string
  title: string
  summary: string
  content: string
  source_urls: string[] | null
  status: string
  created_at: string
}

type EducationAttachment = {
  id: string
  file_name: string
  file_type: string
  storage_bucket: string
  storage_path: string
  url?: string
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: resource } = await supabase
    .from('education_resources')
    .select('title')
    .eq('id', id)
    .eq('status', 'APPROVED')
    .maybeSingle<{ title: string }>()

  return {
    title: resource ? `${resource.title} - The Green List` : 'Resource - The Green List',
  }
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default async function EducationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: resource, error } = await supabase
    .from('education_resources')
    .select('id, category, title, summary, content, source_urls, status, created_at')
    .eq('id', id)
    .maybeSingle<EducationDetailRow>()

  // 404 for anything not APPROVED so pending/draft/rejected content is never leaked.
  if (error || !resource || resource.status !== 'APPROVED') {
    notFound()
  }

  const paragraphs = resource.content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const sourceUrls = (resource.source_urls ?? []).filter(Boolean)
  const { data: attachmentRows } = await supabase
    .from('education_attachments')
    .select('id, file_name, file_type, storage_bucket, storage_path')
    .eq('resource_id', resource.id)
    .order('created_at')
    .returns<EducationAttachment[]>()
  const attachments = await Promise.all(
    (attachmentRows ?? []).map(async (attachment) => {
      const { data } = await supabase.storage.from(attachment.storage_bucket).createSignedUrl(attachment.storage_path, 3600)
      return { ...attachment, url: data?.signedUrl }
    }),
  )

  return (
    <PageShell width="record">
      <RecordHeader
        eyebrow="Learn"
        kind={educationCategoryLabel(resource.category)}
        recordId={recordId('EDU', resource.id)}
        title={resource.title}
        lede={resource.summary}
        status={{ label: 'Reviewed', tone: 'confirmed', meaning: 'Reviewed for accuracy and sourcing before publication.' }}
        meta={[
          { label: 'Published', value: formatDate(resource.created_at) },
          { label: 'Sources', value: `${sourceUrls.length} listed` },
        ]}
        actions={
          <Link href="/education" className="greenlist-quiet-button">
            All resources
          </Link>
        }
      />

      <Panel className="mt-8" bodyClassName="gl-prose">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-wrap">
            {paragraph}
          </p>
        ))}
      </Panel>

      <Panel title="Sources" aside={sourceUrls.length ? `${sourceUrls.length} cited` : 'None listed'} className="mt-6">
        {sourceUrls.length ? (
          <div className="grid gap-3">
            {sourceUrls.map((url) => (
              <SourceCard key={url} sourceClass="Cited source" origin={hostOf(url)} url={url} method="Listed by the author; checked by reviewers" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--gl-text-muted)]">The author did not list external sources for this resource.</p>
        )}
      </Panel>

      {attachments.length > 0 ? (
        <Panel title="Supporting materials" aside="Links expire after one hour" className="mt-6">
          <ul className="grid gap-2 text-sm">
            {attachments.map((attachment) => (
              <li key={attachment.id} className="gl-meta">
                {attachment.url ? (
                  <a href={attachment.url} className="gl-link">
                    {attachment.file_name}
                  </a>
                ) : (
                  <span>{attachment.file_name}</span>
                )}
                <span>{attachment.file_type}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <LimitationsPanel subject="resource" className="mt-8" />
    </PageShell>
  )
}
