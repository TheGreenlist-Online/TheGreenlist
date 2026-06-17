import { AdminSectionPage } from '@/components/AdminSectionPage'

export default async function AdminSourcesPage() {
  return AdminSectionPage({
    title: 'Source review',
    description: 'Track source reliability, source health, and citation quality for transparency and education content.',
  })
}
