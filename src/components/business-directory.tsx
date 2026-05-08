'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

// Mock data
const mockBusinesses = [
  {
    id: '1',
    name: 'Green Valley Dispensary',
    type: 'Dispensary',
    location: 'California',
    transparencyScore: 8.5,
    reviews: 124,
    rating: 4.2,
    badges: ['Compliance Verified', 'Safety Certified']
  },
  {
    id: '2',
    name: 'Pure Harvest Labs',
    type: 'Lab',
    location: 'Colorado',
    transparencyScore: 9.1,
    reviews: 89,
    rating: 4.8,
    badges: ['ISO Certified', 'Third Party Tested']
  },
  {
    id: '3',
    name: 'Mountain Grow Co.',
    type: 'Grower',
    location: 'Washington',
    transparencyScore: 7.2,
    reviews: 67,
    rating: 3.9,
    badges: ['Organic Certified']
  }
]

export function BusinessDirectory() {
  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => mockBusinesses
  })

  return (
    <div className="space-y-6">
      {businesses?.map((business) => (
        <div key={business.id} className="glassmorphism p-6 rounded-lg hover:neon-glow transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Link href={`/businesses/${business.id}`}>
                <h3 className="text-xl font-semibold text-blacklist-green hover:text-white transition-colors">
                  {business.name}
                </h3>
              </Link>
              <p className="text-gray-400">{business.type} • {business.location}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blacklist-green">
                {business.transparencyScore}/10
              </div>
              <div className="text-sm text-gray-400">Transparency Score</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {business.badges.map((badge) => (
              <span key={badge} className="text-xs bg-blacklist-green/20 text-blacklist-green px-2 py-1 rounded">
                {badge}
              </span>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-yellow-400 mr-1">★</span>
                <span className="text-sm">{business.rating}</span>
                <span className="text-gray-400 text-sm ml-1">({business.reviews} reviews)</span>
              </div>
            </div>
            <Link href={`/businesses/${business.id}`} className="btn-secondary text-sm">
              View Profile
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}