import { SimplePage } from '@/components/SimplePage'

export default function HelpPage() {
  return (
    <SimplePage
      title="Help Center"
      subtitle="Guidance for using the platform, submitting reports, understanding listings, and participating responsibly."
      sections={[
        {
          heading: 'How to use the site',
          body: 'Users will be able to browse public information, read accountability content, join discussions, and submit reports through structured workflows.',
        },
        {
          heading: 'Responsible participation',
          body: 'The platform should encourage evidence, clarity, fairness, and lawful public-interest discussion.',
        },
      ]}
    />
  )
}
