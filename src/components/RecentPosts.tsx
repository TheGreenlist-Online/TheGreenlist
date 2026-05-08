'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, ThumbsUp, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Post {
  id: string
  title: string
  content: string
  createdAt: string
  author: {
    name: string
    username: string
  }
  forum: {
    name: string
    slug: string
  }
  _count: {
    comments: number
    votes: number
  }
}

export function RecentPosts() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['recent-posts'],
    queryFn: async () => {
      const response = await fetch('/api/posts?limit=10')
      if (!response.ok) throw new Error('Failed to fetch posts')
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <section className="py-12">
        <h2 className="text-3xl font-bold tracking-tight mb-8">Recent Posts</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Recent Posts</h2>
        <Link
          href="/posts"
          className="text-sm font-medium text-accent hover:text-accent/80"
        >
          View all posts →
        </Link>
      </div>

      <div className="space-y-4">
        {posts?.posts?.map((post: Post, index: number) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md"
          >
            <Link href={`/posts/${post.id}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>by {post.author.name || post.author.username}</span>
                    <span>in {post.forum.name}</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 ml-4">
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post._count.comments}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post._count.votes}</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  )
}