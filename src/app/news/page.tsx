import { NewsFeed } from '@/components/news-feed'
import { TrendingTopics } from '@/components/trending-topics'

export default function NewsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-blacklist-green">News & Investigations</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <NewsFeed />
        </div>
        <div>
          <TrendingTopics />
        </div>
      </div>
    </div>
  )
}