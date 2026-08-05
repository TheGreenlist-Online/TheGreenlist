import Parser from 'rss-parser'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getOpenAIClient } from '@/lib/openai'
import { NEWS_SOURCES, type NewsSource } from '@/lib/newsSources'
import { runJob, type JobResult } from '@/lib/jobs/runJob'

const ITEMS_PER_FEED = 5
const MAX_SUMMARIZED_PER_RUN = 20
const OPENAI_MODEL = 'gpt-4o-mini'

const parser = new Parser({
  timeout: 15_000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; TheGreenListNewsBot/1.0)',
  },
})

type FeedItem = {
  title: string
  link: string
  description: string
  publishedAt: string | null
  source: NewsSource
}

function stripHtml(input: string | undefined | null): string {
  if (!input) return ''
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchFeedItems(source: NewsSource): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(source.url)
    const items = (feed.items ?? []).slice(0, ITEMS_PER_FEED)

    return items
      .filter((item) => item.link && item.title)
      .map((item) => ({
        title: item.title as string,
        link: item.link as string,
        description: stripHtml(
          (item as unknown as { contentSnippet?: string }).contentSnippet ||
            item.content ||
            item.summary ||
            '',
        ),
        publishedAt: item.pubDate || item.isoDate || null,
        source,
      }))
  } catch (error) {
    console.error(
      `[refreshNews] Failed to fetch feed "${source.name}" (${source.url}):`,
      error instanceof Error ? error.message : error,
    )
    return []
  }
}

async function summarizeWithOpenAI(
  title: string,
  description: string,
): Promise<{ summary: string; tags: string[] } | null> {
  const client = getOpenAIClient()
  if (!client) return null

  try {
    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You summarize cannabis industry and policy news for a transparency-focused news feed. Respond ONLY with compact JSON: {"summary": string, "tags": string[]}. The summary must be 1-2 sentences. Provide up to 3 short lowercase topical tags.',
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nSnippet: ${description.slice(0, 800)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 180,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) return null

    const parsed = JSON.parse(raw) as { summary?: string; tags?: string[] }
    if (!parsed.summary) return null

    return {
      summary: parsed.summary.trim(),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3).map((t) => String(t).trim()) : [],
    }
  } catch (error) {
    console.error('[refreshNews] OpenAI summarization failed, falling back to RSS snippet:', error instanceof Error ? error.message : error)
    return null
  }
}

export async function refreshNewsCore(): Promise<JobResult> {
  const admin = createSupabaseAdminClient()
  const warnings: string[] = []

  const feedResults = await Promise.all(NEWS_SOURCES.map((source) => fetchFeedItems(source)))
  const allItems = feedResults.flat()

  const failedFeeds = NEWS_SOURCES.filter((_, index) => feedResults[index].length === 0)
  if (failedFeeds.length > 0) {
    warnings.push(`${failedFeeds.length} feed(s) returned no items: ${failedFeeds.map((f) => f.name).join(', ')}`)
  }

  if (allItems.length === 0) {
    return {
      status: warnings.length > 0 ? 'error' : 'success',
      itemsProcessed: 0,
      message: warnings.length > 0 ? `No items fetched. ${warnings.join(' ')}` : 'No items found across all feeds.',
    }
  }

  const links = allItems.map((item) => item.link)
  const { data: existing, error: existingError } = await admin
    .from('news')
    .select('source_url')
    .in('source_url', links)

  if (existingError) {
    console.error('[refreshNews] Failed to check existing news rows:', existingError.message)
  }

  const existingUrls = new Set((existing ?? []).map((row) => row.source_url))
  const newItems = allItems.filter((item) => !existingUrls.has(item.link))

  if (newItems.length === 0) {
    return {
      status: warnings.length > 0 ? 'partial' : 'success',
      itemsProcessed: 0,
      message: warnings.length > 0
        ? `No new items to add. ${warnings.join(' ')}`
        : 'No new items to add; all fetched items already exist.',
    }
  }

  let summarizedCount = 0
  let insertErrorCount = 0
  const rowsToInsert = []

  for (const item of newItems) {
    let summary = item.description.slice(0, 400) || item.title
    let tags: string[] = []

    if (summarizedCount < MAX_SUMMARIZED_PER_RUN) {
      const aiResult = await summarizeWithOpenAI(item.title, item.description)
      if (aiResult) {
        summary = aiResult.summary
        tags = aiResult.tags
      }
      summarizedCount += 1
    }

    rowsToInsert.push({
      title: item.title,
      summary,
      content: item.description || null,
      source_name: item.source.name,
      source_url: item.link,
      category: item.source.category,
      tags,
      published_at: item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
    })
  }

  const { error: insertError, count } = await admin
    .from('news')
    .insert(rowsToInsert, { count: 'exact' })

  if (insertError) {
    console.error('[refreshNews] Failed to insert news rows:', insertError.message)
    insertErrorCount = rowsToInsert.length
  }

  const itemsProcessed = insertErrorCount > 0 ? 0 : (count ?? rowsToInsert.length)
  const status: JobResult['status'] = insertErrorCount > 0
    ? 'error'
    : warnings.length > 0
      ? 'partial'
      : 'success'

  const messageParts = [`Processed ${allItems.length} feed item(s) from ${NEWS_SOURCES.length} source(s).`, `Inserted ${itemsProcessed} new item(s).`]
  if (warnings.length > 0) messageParts.push(...warnings)
  if (insertErrorCount > 0) messageParts.push(`Failed to insert ${insertErrorCount} item(s): ${insertError?.message}`)

  return {
    status,
    itemsProcessed,
    message: messageParts.join(' '),
  }
}

/**
 * Entry point used by both the scheduled cron route and the admin manual
 * trigger. Wraps refreshNewsCore with the shared automation_jobs lifecycle
 * logging via runJob.
 */
export async function refreshNews() {
  return runJob('refresh-news', refreshNewsCore)
}
