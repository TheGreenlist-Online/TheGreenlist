import { Suspense } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'News - THEBLACKLIST.ONLINE',
  description: 'Latest news and articles about cannabis industry transparency and accountability.',
}

function NewsContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">News & Articles</h1>
      <p className="text-gray-400 mb-8">Latest news from the cannabis industry and transparency updates.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
          <div className="bg-gray-800 h-48"></div>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2">No articles yet</h3>
            <p className="text-gray-400">News articles will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading news...</div>}>
          <NewsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
