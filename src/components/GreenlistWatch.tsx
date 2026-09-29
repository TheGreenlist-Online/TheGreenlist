import Link from 'next/link'

const updates = [
  {
    status: 'NEW REPORT',
    title: 'Transparency activity will appear here as reports are published.',
    time: 'Live feed initializing',
    href: '/reports',
  },
  {
    status: 'VERIFICATION',
    title: 'Verified business updates will appear here.',
    time: 'Awaiting activity',
    href: '/businesses',
  },
  {
    status: 'COMMUNITY',
    title: 'Community events and platform updates will appear here.',
    time: 'Awaiting activity',
    href: '/forums',
  },
]

export function GreenlistWatch() {
  return (
    <aside className="greenlist-watch" aria-label="Greenlist live transparency updates">
      <div className="greenlist-watch__header">
        <span>🌱</span>
        <div>
          <p>Greenlist Watch</p>
          <h2>Live Transparency Feed</h2>
        </div>
      </div>

      <div className="greenlist-watch__items">
        {updates.map((update) => (
          <Link href={update.href} key={update.status} className="greenlist-watch__item">
            <span>{update.status}</span>
            <strong>{update.title}</strong>
            <small>{update.time}</small>
          </Link>
        ))}
      </div>
    </aside>
  )
}
