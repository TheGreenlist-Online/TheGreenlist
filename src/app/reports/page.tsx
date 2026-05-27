import { Suspense } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Reports - THEBLACKLIST.ONLINE',
  description: 'Transparency reports on cannabis industry businesses and practices.',
}

function ReportsContent() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Transparency Reports</h1>
      <p className="text-gray-400 mb-8">Community-generated reports on cannabis industry transparency and accountability.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
          <div className="text-2xl font-bold text-green-400 mb-2">0</div>
          <p className="text-gray-400">Active Reports</p>
        </div>
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
          <div className="text-2xl font-bold text-green-400 mb-2">0</div>
          <p className="text-gray-400">Verified Claims</p>
        </div>
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
          <div className="text-2xl font-bold text-green-400 mb-2">0</div>
          <p className="text-gray-400">Businesses Reviewed</p>
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading reports...</div>}>
          <ReportsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
