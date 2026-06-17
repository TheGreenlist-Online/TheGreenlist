import { AdminSectionPage } from '@/components/AdminSectionPage'

export default async function AdminNewsPage() {
  return AdminSectionPage({
    title: 'News controls',
    description: 'Manage source-linked news briefs, summaries, and editorial review items for the platform.',
  })
}
