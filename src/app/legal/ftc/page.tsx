import { SimplePage } from '@/components/SimplePage'

export const metadata = {
  title: 'Paid relationships disclosure - The Green List',
}

export default function FTCPage() {
  return (
    <SimplePage
      eyebrow="Disclosure"
      documentId="GL-LEGAL-FTC"
      title="Paid relationships disclosure"
      subtitle="Where any sponsorship, affiliate relationship, advertisement, or compensated placement would be disclosed, and the standard that applies to it."
      sections={[
        {
          heading: 'Current position',
          body: 'The Green List does not sell placement in records, findings, or Learn resources, and does not accept compensation for a status label. See the funding statement for how the platform is paid for.',
        },
        {
          heading: 'Disclosure standard',
          body: 'If a paid relationship with a business, product, or outlet ever exists, it is disclosed on every record it touches, in plain language, next to the content it concerns. Paid material is never mixed into records or findings.',
        },
        {
          heading: 'Compliance',
          body: 'Disclosures follow the Federal Trade Commission guidance on endorsements and testimonials. Questions about a specific record can be sent through the corrections process.',
        },
      ]}
    />
  )
}
