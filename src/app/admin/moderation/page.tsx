import { AdminSectionPage } from '@/components/AdminSectionPage'

export default async function AdminModerationPage() {
  return AdminSectionPage({
    title: 'Moderation',
    description: 'Review moderation signals and community safety actions. AI can flag content, but admin review controls final decisions.',
  })
}
