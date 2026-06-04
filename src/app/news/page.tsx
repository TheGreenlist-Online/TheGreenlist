import { SimplePage } from '@/components/SimplePage'

export default function NewsPage() {
  return (
    <SimplePage
      title="News"
      subtitle="Cannabis industry updates, policy shifts, consumer alerts, accountability stories, and transparency-focused reporting."
      sections={[
        {
          heading: 'Industry updates',
          body: 'This page will collect cannabis market news, regulatory changes, public safety notices, and business accountability updates.',
        },
        {
          heading: 'Transparency lens',
          body: 'News content should focus on what consumers, patients, workers, and responsible operators need to know to make informed decisions.',
        },
      ]}
    />
  )
}
