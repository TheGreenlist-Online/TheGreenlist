'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

// Mock data
const mockPosts = [
  {
    id: '1',
    title: 'New contamination found in major brand products',
    category: 'Consumer Safety',
    author: 'Anonymous',
    replies: 23,
    lastReply: '10 minutes ago'
  },
  {
    id: '2',
    title: 'Policy changes affecting small growers',
    category: 'Policy & Legislation',
    author: 'GreenThumb',
    replies: 45,
    lastReply: '1 hour ago'
  },
  {
    id: '3',
    title: 'Worker rights violations at processing facility',
    category: 'Worker Rights',
    author: 'Anonymous',
    replies: 12,
    lastReply: '2 hours ago'
  }
]

export function RecentPosts() {
  const { data: posts } = useQuery({
    queryKey: ['recent-posts'],
    queryFn: async () => mockPosts
  })

  return (
    <div className="glassmorphism p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-blacklist-green">Recent Posts</h3>
      <div className="space-y-4">
        {posts?.map((post) => (
          <div key={post.id} className="border-b border-gray-700 pb-4 last:border-b-0">
            <Link href={`/forums/post/${post.id}`}>
              <h4 className="font-medium text-white hover:text-blacklist-green transition-colors">
                {post.title}
              </h4>
            </Link>
            <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
              <span>{post.category}</span>
              <span>{post.replies} replies</span>
            </div>
            <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
              <span>by {post.author}</span>
              <span>{post.lastReply}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Link href="/forums/new-post" className="btn-primary w-full text-center">
          Create New Post
        </Link>
      </div>
    </div>
  )
}