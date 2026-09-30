import {
  Archive,
  BookOpen,
  Building2,
  Compass,
  Home,
  Landmark,
  Newspaper,
  Send,
  ShieldCheck,
  Trees,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TownIcon } from '@/config/town-locations'

const ICONS: Record<TownIcon, LucideIcon> = {
  archive: Archive,
  book: BookOpen,
  building: Building2,
  compass: Compass,
  home: Home,
  landmark: Landmark,
  newspaper: Newspaper,
  send: Send,
  shield: ShieldCheck,
  trees: Trees,
  users: Users,
}

export function TownLocationIcon({ icon, className }: { icon: TownIcon; className?: string }) {
  const Icon = ICONS[icon]
  return <Icon className={className} aria-hidden="true" />
}
