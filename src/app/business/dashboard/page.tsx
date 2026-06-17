import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { UserRole } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { SimplePage } from '@/components/SimplePage'

const allowedRoles = new Set<UserRole>([
  UserRole.BUSINESS,
  UserRole.DISTRIBUTOR,
  UserRole.CULTIVATOR,
  UserRole.ADMIN,
])

export default async function BusinessDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/business/dashboard')
  }

  if (!allowedRoles.has(session.user.role)) {
    notFound()
  }

  return (
    <SimplePage
      title="Organization dashboard"
      subtitle="Protected transparency tools for authorized business, distributor, cultivator, and admin roles."
      sections={[
        {
          heading: 'Profile status',
          body: 'Review placeholder status for organization profile claims, public trust context, and verification readiness.',
        },
        {
          heading: 'Transparency signals',
          body: 'Future analytics can summarize public reports, response status, disclosures, and forum activity without enabling commerce.',
        },
        {
          heading: 'Report triage',
          body: 'Authorized roles can later review relevant accountability workflows with server-side authorization checks.',
        },
        {
          heading: 'Compliance boundary',
          body: 'This dashboard is informational only and does not include ordering, checkout, payment, delivery, fulfillment, menus, or inventory tools.',
        },
      ]}
    />
  )
}
