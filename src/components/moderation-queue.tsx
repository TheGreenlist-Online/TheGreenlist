'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

// Mock data
const mockQueue = [
  {
    id: '1',
    type: 'Post',
    title: 'Discussion about new cultivation techniques',
    author: 'GreenThumb',
    flagged: 'Potential misinformation',
    time: '30 minutes ago'
  },
  {
    id: '2',
    type: 'Comment',
    title: 'Reply to safety concerns',
    author: 'Anonymous',
    flagged: 'Harassment detected',
    time: '1 hour ago'
  },
  {
    id: '3',
    type: 'Report',
    title: 'Business transparency issue',
    author: 'Whistleblower',
    flagged: 'Legal review needed',
    time: '2 hours ago'
  }
]

export function ModerationQueue() {
  const { data: queue } = useQuery({
    queryKey: ['moderation-queue'],
    queryFn: async () => mockQueue
  })

  return (
    <div className="glassmorphism p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-blacklist-green">Moderation Queue</h3>
      <div className="space-y-4">
        {queue?.map((item) => (
          <div key={item.id} className="border-b border-gray-700 pb-4 last:border-b-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className={`text-xs px-2 py-1 rounded mr-2 ${
                  item.type === 'Post' ? 'bg-blue-900 text-blue-300' :
                  item.type === 'Comment' ? 'bg-green-900 text-green-300' :
                  'bg-purple-900 text-purple-300'
                }`}>
                  {item.type}
                </span>
                <Link href={`/admin/moderate/${item.id}`}>
                  <span className="font-medium text-white hover:text-blacklist-green transition-colors">
                    {item.title}
                  </span>
                </Link>
              </div>
            </div>
            <div className="text-sm text-gray-400 mb-1">
              by {item.author} • {item.time}
            </div>
            <div className="text-xs text-yellow-400">
              {item.flagged}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Link href="/admin/moderation" className="btn-secondary w-full text-center">
          View Full Queue
        </Link>
      </div>
    </div>
  )
}