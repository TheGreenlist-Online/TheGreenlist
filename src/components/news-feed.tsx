'use client'

import { useQuery } from '@tanstack/react-query'

// Mock data for now
const mockNews = [
  {
    id: '1',
    title: 'New Cannabis Policy Changes in California',
    summary: 'California announces new regulations for cannabis businesses...',
    source: 'Cannabis Policy Report',
    publishedAt: '2024-01-15',
    tags: ['policy', 'california']
  },
  {
    id: '2',
    title: 'Industry Transparency Initiative Launched',
    summary: 'Major cannabis associations commit to transparency standards...',
    source: 'Industry News',
    publishedAt: '2024-01-14',
    tags: ['transparency', 'industry']
  },
  {
    id: '3',
    title: 'Safety Concerns Raised in Product Testing',
    summary: 'Recent lab tests reveal contamination issues...',
    source: 'Safety Watch',
    publishedAt: '2024-01-13',
    tags: ['safety', 'testing']
  }
]

export function NewsFeed() {
  const { data: news, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      // TODO: Implement actual news API
      return mockNews
    }
  })

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-blacklist-green">
          Latest News & Investigations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news?.map((article) => (
            <article key={article.id} className="glassmorphism p-6 rounded-lg hover:neon-glow transition-all duration-300">
              <div className="flex flex-wrap gap-2 mb-3">
                {article.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-blacklist-green/20 text-blacklist-green px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                {article.title}
              </h3>
              <p className="text-gray-400 mb-4">
                {article.summary}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{article.source}</span>
                <span>{article.publishedAt}</span>
              </div>
            </article>
          ))}
        </div>
        <div className="text-center mt-12">
          <button className="btn-secondary">
            View All News
          </button>
        </div>
      </div>
    </section>
  )
}