import { SimplePage } from '@/components/SimplePage'

export default function ReportsPage() {
  return (
    <SimplePage
      title="Reports"
      subtitle="A future hub for structured reports, public complaints, incident summaries, and transparency documentation."
      sections={[
        {
          heading: 'Consumer and community reports',
          body: 'Reports can document patterns involving service issues, product concerns, misleading claims, unsafe practices, or other accountability matters.',
        },
        {
          heading: 'Evidence-oriented intake',
          body: 'The reporting workflow should eventually collect dates, locations, business names, screenshots, receipts, product labels, and witness details where appropriate.',
        },
      ]}
    />
  )
}
