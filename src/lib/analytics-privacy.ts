import type { BeforeSendEvent } from '@vercel/analytics/next'

// Explicit allow-list: no report/evidence pages, auth callbacks, usernames,
// organization identifiers, search text, query strings, or URL fragments.
const PUBLIC_ANALYTICS_PATHS = new Set([
  '/', '/businesses', '/businesses/claim', '/contact', '/help', '/news',
  '/education', '/forums', '/reports', '/auth/register',
])

export function redactAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url)
    if (!PUBLIC_ANALYTICS_PATHS.has(url.pathname)) return null
    url.search = ''
    url.hash = ''
    return { ...event, url: url.toString() }
  } catch {
    return null
  }
}
