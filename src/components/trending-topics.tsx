'use client'

import { useQuery } from '@tanstack/react-query'

// Mock data
const mockTrends = [
  { topic: 'Product Contamination', count: 45, change: '+12%' },
  { topic: 'Policy Changes', count: 38, change: '+8%' },
  { topic: 'Worker Rights', count: 29, change: '+15%' },
  { topic: 'Safety Violations', count: 22, change: '+5%' },
  { topic: 'Corporate Fraud', count: 18, change: '+22%' }
]

export function TrendingTopics() {
  const { data: trends } = useQuery({
    queryKey: ['trending-topics'],
    queryFn: async () => mockTrends
  })

  return (
    <div className="glassmorphism p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-blacklist-green">Trending Topics</h3>
      <div className="space-y-3">
        {trends?.map((trend, index) => (
          <div key={trend.topic} className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-blacklist-green font-bold mr-3">#{index + 1}</span>
              <span className="text-white">{trend.topic}</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">{trend.count} articles</div>
              <div className="text-xs text-green-400">{trend.change}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}