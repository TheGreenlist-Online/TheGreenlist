import { SimplePage } from '@/components/SimplePage'

export default function ReportIssuePage() {
  return (
    <SimplePage
      title="Report Issue"
      subtitle="A future intake page for platform issues, business concerns, product concerns, and transparency reports."
      sections={[
        {
          heading: 'What to report',
          body: 'Users may eventually report inaccurate listings, safety concerns, suspicious business conduct, broken pages, or moderation issues.',
        },
        {
          heading: 'Useful evidence',
          body: 'Strong reports should include dates, names, locations, screenshots, receipts, labels, supporting documents, and a clear timeline when available.',
        },
      ]}
    />
  )
}
