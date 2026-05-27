import { Suspense } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Forums - THEBLACKLIST.ONLINE',
  description: 'Community forums for cannabis industry discussions and transparency.',
}

function ForumsContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Forums</h1>
      <p className="text-gray-400 mb-8">Join the conversation about cannabis industry transparency and accountability.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
          <h2 className="text-xl font-bold mb-2">General Discussion</h2>
          <p className="text-gray-400">Open discussion forum for all topics.</p>
        </div>
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
          <h2 className="text-xl font-bold mb-2">Industry News</h2>
          <p className="text-gray-400">Latest news and updates from the cannabis industry.</p>
        </div>
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
          <h2 className="text-xl font-bold mb-2">Business Reviews</h2>
          <p className="text-gray-400">Reviews and feedback about cannabis businesses.</p>
        </div>
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
          <h2 className="text-xl font-bold mb-2">Regulatory Updates</h2>
          <p className="text-gray-400">Discuss regulatory changes and compliance.</p>
        </div>
      </div>
    </div>
  )
}

export default function ForumsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading forums...</div>}>
          <ForumsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
