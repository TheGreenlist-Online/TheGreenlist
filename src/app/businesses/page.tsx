import { SimplePage } from '@/components/SimplePage'

export default function BusinessesPage() {
  return (
    <SimplePage
      title="Businesses"
      subtitle="A public-facing directory concept for cannabis businesses, accountability records, transparency signals, and consumer verification."
      sections={[
        {
          heading: 'Business profiles',
          body: 'This section will eventually organize cannabis businesses with public information, transparency markers, review signals, and accountability history.',
        },
        {
          heading: 'Verification-first design',
          body: 'The goal is not blind promotion. The goal is a clearer view of who operates responsibly, who communicates honestly, and who earns public trust.',
        },
      ]}
    />
  )
}
