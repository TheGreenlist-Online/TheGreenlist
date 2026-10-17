import { AdminSectionPage } from '@/components/AdminSectionPage'

export default async function AdminPage() {
  return AdminSectionPage({
    title: 'Review operations',
    description: 'Restricted tools for report review, source checks, moderation, submissions, and operational logs. Every action here is recorded in the audit log.',
    current: '/admin',
  })
}
