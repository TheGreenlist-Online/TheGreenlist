import { Suspense } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Trending - THEBLACKLIST.ONLINE',
  description: 'Trending topics, reports, and discussions on THEBLACKLIST.ONLINE.',
}

function TrendingContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Trending</h1>
      <p className="text-gray-400 mb-8">Popular discussions, reports, and topics across the platform.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">#1</span>
            <span className="text-green-400 text-sm">Trending</span>
          </div>
          <h3 className="text-lg font-bold mb-2">No trending items yet</h3>
          <p className="text-gray-400 mb-4">Trending topics will appear here.</p>
          <span className="inline-block text-xs text-gray-500">0 discussions</span>
        </div>
      </div>
    </div>
  )
}

export default function TrendingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading trending items...</div>}>
          <TrendingContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
