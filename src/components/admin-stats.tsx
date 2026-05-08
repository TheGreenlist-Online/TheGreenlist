'use client'

import { useQuery } from '@tanstack/react-query'

// Mock data
const mockStats = {
  totalUsers: 15420,
  activeUsers: 3240,
  totalPosts: 8750,
  pendingReports: 23,
  moderatedContent: 1247,
  transparencyScore: 8.4
}

export function AdminStats() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => mockStats
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="glassmorphism p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blacklist-green mb-2">Total Users</h3>
        <p className="text-3xl font-bold text-white">{stats?.totalUsers.toLocaleString()}</p>
        <p className="text-sm text-gray-400">{stats?.activeUsers} active today</p>
      </div>

      <div className="glassmorphism p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blacklist-green mb-2">Forum Posts</h3>
        <p className="text-3xl font-bold text-white">{stats?.totalPosts.toLocaleString()}</p>
        <p className="text-sm text-gray-400">+127 this week</p>
      </div>

      <div className="glassmorphism p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blacklist-green mb-2">Pending Reports</h3>
        <p className="text-3xl font-bold text-white">{stats?.pendingReports}</p>
        <p className="text-sm text-yellow-400">Requires attention</p>
      </div>

      <div className="glassmorphism p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blacklist-green mb-2">Moderated Content</h3>
        <p className="text-3xl font-bold text-white">{stats?.moderatedContent.toLocaleString()}</p>
        <p className="text-sm text-gray-400">Content reviewed</p>
      </div>

      <div className="glassmorphism p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blacklist-green mb-2">Platform Trust</h3>
        <p className="text-3xl font-bold text-white">{stats?.transparencyScore}/10</p>
        <p className="text-sm text-gray-400">Community trust score</p>
      </div>

      <div className="glassmorphism p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blacklist-green mb-2">AI Moderation</h3>
        <p className="text-3xl font-bold text-white">94.2%</p>
        <p className="text-sm text-gray-400">Accuracy rate</p>
      </div>
    </div>
  )
}