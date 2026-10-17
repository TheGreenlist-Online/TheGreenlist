import { AdminSectionPage } from '@/components/AdminSectionPage'

export default async function AdminReviewPage() {
  return AdminSectionPage({
    title: 'Review queue',
    description: 'Pending reports, flagged submissions, and evidence context awaiting a documentary decision before any public action.',
    current: '/admin/review',
  })
}
