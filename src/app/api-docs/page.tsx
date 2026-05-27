import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'API Documentation - THEBLACKLIST.ONLINE',
  description: 'API documentation and developer resources for THEBLACKLIST.ONLINE.',
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-4xl font-bold mb-6">API Documentation</h1>
          
          <div className="prose prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
              <p className="text-gray-400 mb-4">
                The THEBLACKLIST.ONLINE API provides programmatic access to transparency data, reports, and forum content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Base URL</h2>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
                <code className="text-green-400">https://api.theblacklist.online/v1</code>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Authentication</h2>
              <p className="text-gray-400 mb-4">
                API endpoints require authentication via API key. Include your API key in request headers.
              </p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <code className="text-green-400">Authorization: Bearer YOUR_API_KEY</code>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Endpoints</h2>
              <div className="space-y-4">
                <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
                  <h3 className="font-bold mb-2 text-green-400">GET /reports</h3>
                  <p className="text-gray-400">Retrieve a list of public reports.</p>
                </div>
                <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
                  <h3 className="font-bold mb-2 text-green-400">GET /businesses</h3>
                  <p className="text-gray-400">Retrieve business directory and transparency data.</p>
                </div>
                <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
                  <h3 className="font-bold mb-2 text-green-400">GET /forums</h3>
                  <p className="text-gray-400">Access public forum posts and discussions.</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Status Codes</h2>
              <div className="space-y-2 text-gray-400">
                <p><span className="font-bold">200</span> - Success</p>
                <p><span className="font-bold">401</span> - Unauthorized</p>
                <p><span className="font-bold">403</span> - Forbidden</p>
                <p><span className="font-bold">404</span> - Not Found</p>
                <p><span className="font-bold">429</span> - Rate Limited</p>
                <p><span className="font-bold">500</span> - Server Error</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
