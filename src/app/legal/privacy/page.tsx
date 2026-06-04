import { SimplePage } from '@/components/SimplePage'

export default function PrivacyPage() {
  return (
    <SimplePage
      title="Privacy Policy"
      subtitle="A plain-language privacy placeholder for TheBlacklist.online. Final policy should match the actual data collected by the app."
      sections={[
        {
          heading: 'Information collected',
          body: 'The platform may collect account information, submitted reports, technical logs, and communication details needed to operate the service.',
        },
        {
          heading: 'Privacy direction',
          body: 'The goal is to minimize unnecessary collection, protect sensitive submissions, and clearly explain how user information is handled.',
        },
      ]}
    />
  )
}
