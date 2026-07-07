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

        {/* Feature cards section */}
        <div className="container mx-auto px-4">
          <FeatureCards />
        </div>

        {/* Divider */}
        <div className="glow-border h-px w-full opacity-30" />

        {/* Forums + sidebar */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Suspense fallback={<div className="text-muted-foreground text-sm py-8">Loading forums…</div>}>
                <FeaturedForums />
              </Suspense>
              <Suspense fallback={<div className="text-muted-foreground text-sm py-8">Loading posts…</div>}>
                <RecentPosts />
              </Suspense>
            </div>
            <div className="lg:col-span-1 space-y-6">
              <Suspense fallback={<div className="text-muted-foreground text-sm py-4">Loading topics…</div>}>
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