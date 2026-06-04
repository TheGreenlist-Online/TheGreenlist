import { SimplePage } from '@/components/SimplePage'

export default function ForumsPage() {
  return (
    <SimplePage
      title="Forums"
      subtitle="Community discussion spaces for cannabis transparency, consumer reports, industry accountability, and open public oversight."
      sections={[
        {
          heading: 'Community watchdog discussions',
          body: 'Forums will give users a place to discuss business practices, consumer experiences, product concerns, and patterns that deserve public attention.',
        },
        {
          heading: 'Structured topics',
          body: 'Future forum categories can include dispensaries, brands, labs, delivery services, product safety, pricing, legal updates, and verified consumer feedback.',
        },
      ]}
    />
  )
}
