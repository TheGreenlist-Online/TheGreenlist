export const DISTRICTS = [
  { id: 'forums', name: 'Forum Hall', description: 'Community discussion, questions, and public debate.', href: '/forums', icon: 'users', position: 'md:col-start-2 md:row-start-1', availability: 'live' },
  { id: 'businesses', name: 'Business District', description: 'Verified properties, public records, responses, and transparency histories.', href: '/businesses', icon: 'building', position: 'md:col-start-1 md:row-start-2', availability: 'live' },
  { id: 'town-hall', name: 'Town Hall', description: 'Legal records, platform policies, governance, and public decisions.', href: '/legal', icon: 'landmark', position: 'md:col-start-2 md:row-start-2', availability: 'live', featured: true },
  { id: 'archives', name: 'Transparency Archives', description: 'Reports, evidence-led records, status histories, and resolved matters.', href: '/reports', icon: 'archive', position: 'md:col-start-3 md:row-start-2', availability: 'live' },
  { id: 'cultivators', name: 'Cultivator Grove', description: 'A filtered view of verified cultivator profiles using the shared business directory.', href: '/businesses?role=CULTIVATOR', icon: 'trees', position: 'md:col-start-1 md:row-start-3', availability: 'planned' },
  { id: 'education', name: 'Knowledge Library', description: 'Education, policy context, and consumer-protection resources.', href: '/education', icon: 'book', position: 'md:col-start-2 md:row-start-3', availability: 'live' },
  { id: 'news', name: 'Newsroom', description: 'Investigations, platform developments, and public-interest reporting.', href: '/news', icon: 'newspaper', position: 'md:col-start-3 md:row-start-3', availability: 'live' },
  { id: 'watchtower', name: 'The Watchtower', description: 'Role-protected moderation, review standards, appeals, and oversight.', href: '/admin/moderation', icon: 'shield', position: 'md:col-start-2 md:row-start-4', availability: 'restricted' },
] as const

