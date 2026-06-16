import { SimplePage } from '@/components/SimplePage'

export default function FTCPage() {
  return (
    <SimplePage
      title="FTC Disclosures"
      subtitle="Disclosure space for sponsored content, affiliate relationships, ads, business listings, and compensation transparency."
      sections={[
        {
          heading: 'Sponsored content',
          body: 'Any paid placement, sponsorship, affiliate relationship, or compensated recommendation should be clearly labeled for users.',
        },
        {
          heading: 'Transparency standard',
          body: 'The Green List should separate editorial/community accountability content from paid visibility or promotional placements.',
        },
      ]}
    />
  )
}
