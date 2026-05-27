import { Suspense } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Business Directory - THEBLACKLIST.ONLINE',
  description: 'Directory of cannabis industry businesses with transparency scores and community reviews.',
}

function BusinessesContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Business Directory</h1>
      <p className="text-gray-400 mb-8">Transparency profiles and community information about cannabis industry businesses.</p>
      
      <div className="mb-8">
        <input 
          type="search" 
          placeholder="Search businesses..." 
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
          <h3 className="text-xl font-bold mb-2">No businesses found</h3>
          <p className="text-gray-400">Business listings coming soon.</p>
        </div>
      </div>
    </div>
  )
}

export default function BusinessesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading businesses...</div>}>
          <BusinessesContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
