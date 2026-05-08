import { ForumCategories } from '@/components/forum-categories'
import { RecentPosts } from '@/components/recent-posts'

export default function ForumsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-blacklist-green">Community Forums</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ForumCategories />
        </div>
        <div>
          <RecentPosts />
        </div>
      </div>
    </div>
  )
}