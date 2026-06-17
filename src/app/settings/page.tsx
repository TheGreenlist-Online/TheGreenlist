import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SimplePage } from '@/components/SimplePage'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/settings')
  }

  return (
    <SimplePage
      title="Settings"
      subtitle="Account and platform settings placeholder for privacy, notifications, profile controls, and security."
      sections={[
        {
          heading: 'Account settings',
          body: 'Users should eventually be able to manage display name, email, notification preferences, privacy settings, and account security.',
        },
        {
          heading: 'Safety controls',
          body: 'Future settings can include data export, account deletion, report history, and moderation preference controls.',
        },
      ]}
    />
  )
}
