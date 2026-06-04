import { SimplePage } from '@/components/SimplePage'

export default function ApiDocsPage() {
  return (
    <SimplePage
      title="API Docs"
      subtitle="Developer documentation placeholder for future TheBlacklist.online data, reporting, moderation, and verification APIs."
      sections={[
        {
          heading: 'Future API access',
          body: 'API documentation can eventually describe endpoints for reports, business profiles, moderation workflows, and verification signals.',
        },
        {
          heading: 'Access control',
          body: 'Any API should use strong authentication, rate limits, audit logs, and privacy-aware data handling.',
        },
      ]}
    />
  )
}
