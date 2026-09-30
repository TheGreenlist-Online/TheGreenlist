import { SimplePage } from '@/components/SimplePage'

export const metadata = {
  title: 'Data access - The Green List',
}

export default function ApiDocsPage() {
  return (
    <SimplePage
      eyebrow="Reference"
      documentId="GL-DOC-API"
      title="Data access"
      subtitle="Programmatic access to published records is planned. This page states the scope and the conditions; no endpoints are live."
      sections={[
        {
          heading: 'Planned scope',
          body: 'Read access to published business records, report outcomes, Learn resources, and source metadata, in the same form and with the same limitations statements shown on the site.',
        },
        {
          heading: 'Conditions',
          body: 'Any interface will require authentication, apply rate limits, log requests in the audit trail, and exclude private report contents and personal data.',
        },
      ]}
    />
  )
}
