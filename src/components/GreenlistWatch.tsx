import Link from 'next/link'

const updates = [
  {
    status: 'REPORTS',
    title: 'Published findings will be listed here with their review status.',
    time: 'No published findings yet',
    href: '/reports',
  },
  {
    status: 'RECORDS',
    title: 'Record updates and status changes will be listed here.',
    time: 'No record updates yet',
    href: '/businesses',
  },
  {
    status: 'CORRECTIONS',
    title: 'Published corrections will be listed here with the reason for each change.',
    time: 'No corrections published yet',
    href: '/forums',
  },
]

export function GreenlistWatch() {
  return (
    <aside className="greenlist-watch" aria-label="Recent record activity">
      <div className="greenlist-watch__header">
        <span aria-hidden="true" />
        <div>
          <p>Record log</p>
          <h2>Recent record activity</h2>
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
