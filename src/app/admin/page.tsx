import { AdminStats } from '@/components/admin-stats'
import { PendingReports } from '@/components/pending-reports'
import { ModerationQueue } from '@/components/moderation-queue'

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-blacklist-green">Admin Dashboard</h1>
      <div className="space-y-8">
        <AdminStats />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PendingReports />
          <ModerationQueue />
        </div>
      </div>
    </div>
  )
}