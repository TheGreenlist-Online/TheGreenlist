import { AdminSectionPage } from '@/components/AdminSectionPage'

export default async function AdminReviewPage() {
  return AdminSectionPage({
    title: 'Review queue',
    description: 'Review pending reports, flagged submissions, evidence context, and transparency items before public action.',
  })
}
