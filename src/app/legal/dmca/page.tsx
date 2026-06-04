import { SimplePage } from '@/components/SimplePage'

export default function DMCAPage() {
  return (
    <SimplePage
      title="DMCA"
      subtitle="Copyright takedown and intellectual property contact page placeholder."
      sections={[
        {
          heading: 'Copyright concerns',
          body: 'Rights holders should be able to submit copyright concerns with enough information to identify the work, the disputed content, and the requesting party.',
        },
        {
          heading: 'Response process',
          body: 'The platform should review notices, remove or restrict content where legally required, and preserve a fair counter-notice process when appropriate.',
        },
      ]}
    />
  )
}
