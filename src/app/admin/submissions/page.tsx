import { AdminSectionPage } from '@/components/AdminSectionPage'

export default async function AdminSubmissionsPage() {
  return AdminSectionPage({
    title: 'Submissions',
    description: 'Reports, public submissions, source suggestions, and evidence intake status.',
    current: '/admin/submissions',
  })
}
