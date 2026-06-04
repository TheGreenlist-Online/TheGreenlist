import { SimplePage } from '@/components/SimplePage'

export default function TermsPage() {
  return (
    <SimplePage
      title="Terms of Service"
      subtitle="Baseline terms for using TheBlacklist.online. This placeholder should be reviewed before final legal publication."
      sections={[
        {
          heading: 'Use of the platform',
          body: 'Users are expected to participate honestly, avoid harassment, avoid knowingly false claims, and use the platform for lawful transparency and accountability purposes.',
        },
        {
          heading: 'Content responsibility',
          body: 'User-submitted content should be factual, evidence-supported where possible, and respectful of applicable laws and rights.',
        },
      ]}
    />
  )
}
