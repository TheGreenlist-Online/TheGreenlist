import { SimplePage } from '@/components/SimplePage'

export default function ProfilePage() {
  return (
    <SimplePage
      title="Profile"
      subtitle="User profile placeholder for account details, saved reports, community activity, and verification settings."
      sections={[
        {
          heading: 'Account overview',
          body: 'This page can later show the user profile, public activity, privacy settings, and submitted reports.',
        },
        {
          heading: 'Identity and trust',
          body: 'Future profile tools can support verified identity, optional anonymity, and reputation signals without exposing unnecessary personal details.',
        },
      ]}
    />
  )
}
