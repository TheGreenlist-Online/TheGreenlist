import { SimplePage } from '@/components/SimplePage'

export default function TrendingPage() {
  return (
    <SimplePage
      title="Trending"
      subtitle="A future signal board for emerging transparency topics, source-linked stories, forum activity, and public accountability patterns."
      sections={[
        {
          heading: 'Trust signals',
          body: 'Trending content should highlight verified patterns, public records, source-backed reports, and community education topics.',
        },
        {
          heading: 'No commerce ranking',
          body: 'This area should not rank products, menus, deals, inventory, deliveries, or marketplace activity.',
        },
      ]}
    />
  )
}
