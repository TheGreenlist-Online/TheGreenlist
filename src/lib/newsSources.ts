/**
 * Free RSS feed sources for the automated news refresh job.
 *
 * Each entry points at a publicly available, no-cost RSS feed from a
 * reputable cannabis industry or cannabis policy publication. URLs were
 * verified to resolve and return valid RSS XML as of the time this file was
 * written. If a feed goes offline or changes its URL, the refresh job will
 * skip it gracefully (see src/lib/jobs/refreshNews.ts) without affecting the
 * other feeds.
 */

export type NewsSourceCategory =
  | 'industry'
  | 'policy'
  | 'business'
  | 'culture'

export type NewsSource = {
  name: string
  url: string
  category: NewsSourceCategory
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    name: 'MJBizDaily',
    url: 'https://mjbizdaily.com/feed/',
    category: 'business',
  },
  {
    name: 'Marijuana Moment',
    url: 'https://www.marijuanamoment.net/feed/',
    category: 'policy',
  },
  {
    name: 'NORML',
    url: 'https://norml.org/feed/',
    category: 'policy',
  },
  {
    name: 'Cannabis Now',
    url: 'https://cannabisnow.com/feed/',
    category: 'culture',
  },
  {
    name: 'mg Magazine',
    url: 'https://mgmagazine.com/feed/',
    category: 'business',
  },
  {
    name: 'Cannabis Industry Journal',
    url: 'https://cannabisindustryjournal.com/feed/',
    category: 'industry',
  },
]
