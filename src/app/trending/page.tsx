import { redirect } from 'next/navigation'

/**
 * "Trending" implied engagement ranking, which a records platform does not
 * publish. The URL is preserved and resolves to source-linked news coverage.
 */
export default function TrendingPage() {
  redirect('/news')
}
