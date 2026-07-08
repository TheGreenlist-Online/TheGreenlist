import { Suspense } from 'react'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { FeatureCards } from '@/components/FeatureCards'
import { FeaturedForums } from '@/components/FeaturedForums'
import { RecentPosts } from '@/components/RecentPosts'
import { TrendingTopics } from '@/components/TrendingTopics'
import { SponsoredContent } from '@/components/SponsoredContent'
import { Footer } from '@/components/Footer'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />

        <div className="container mx-auto px-4">
          <FeatureCards />
        </div>

        <div className="glow-border h-px w-full opacity-30" />

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-3">
              <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Loading forums…</div>}>
                <FeaturedForums />
              </Suspense>
              <Suspense fallback={<div className="py-8 text-sm text-muted-foreground">Loading posts…</div>}>
                <RecentPosts />
              </Suspense>
            </div>
            <div className="space-y-6 lg:col-span-1">
              <Suspense fallback={<div className="py-4 text-sm text-muted-foreground">Loading topics…</div>}>
                <TrendingTopics />
              </Suspense>
              <SponsoredContent />
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <LegalDisclaimer />
    </div>
  )
}
