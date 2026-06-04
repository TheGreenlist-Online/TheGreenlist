import { SimplePage } from '@/components/SimplePage'

export default function ContactPage() {
  return (
    <SimplePage
      title="Contact Us"
      subtitle="Contact TheBlacklist.online for support, partnerships, corrections, safety concerns, or general platform questions."
      sections={[
        {
          heading: 'General contact',
          body: 'For now, contact can be routed through support@theblacklist.online until a dedicated contact form is connected.',
        },
        {
          heading: 'Corrections and disputes',
          body: 'Businesses and users should have a clear path to request corrections, submit context, or dispute inaccurate information.',
        },
      ]}
    />
  )
}
