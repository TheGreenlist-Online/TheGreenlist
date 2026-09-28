import { AdminSectionPage } from '@/components/AdminSectionPage'

export default async function AdminSourcesPage() {
  return AdminSectionPage({
    title: 'Source review',
    description: 'Source classes, retrieval dates, and citation quality across records and Learn resources.',
    current: '/admin/sources',
  })
}
