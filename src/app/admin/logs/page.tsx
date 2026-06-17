import { AdminSectionPage } from '@/components/AdminSectionPage'

export default function AdminLogsPage() {
  return AdminSectionPage({
    title: 'System logs',
    description: 'Inspect platform health, automation events, and integration warnings without exposing secrets.',
  })
}
