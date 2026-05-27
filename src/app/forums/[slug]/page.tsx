import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Forum - THEBLACKLIST.ONLINE',
  description: 'Forum discussion on THEBLACKLIST.ONLINE.',
}

interface ForumPageProps {
  params: {
    slug: string
  }
}

export default function ForumPage({ params }: ForumPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-6 capitalize">{decodeURIComponent(params.slug)}</h1>
          <div className="border border-gray-700 rounded-lg p-8 bg-gray-900">
            <p className="text-gray-400">Forum posts will appear here.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
