import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Hero } from '@/components/hero'
import { ProductGallery } from '@/components/product-gallery'
import { ProductForums } from '@/components/product-forums'
import { NewsFeed } from '@/components/news-feed'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glassmorphism sticky top-0 z-50 bg-blacklist-gray/80">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-blacklist-accent-yellow">THE</span>
            <span className="text-blacklist-green-bright">BLACKLIST</span>
          </Link>
          <div className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/products" className="hover:text-blacklist-accent-red transition-colors">
              Products
            </Link>
            <Link href="/forums" className="hover:text-blacklist-accent-red transition-colors">
              Forums
            </Link>
            <Link href="/reviews" className="hover:text-blacklist-accent-red transition-colors">
              Reviews
            </Link>
            <Link href="/dispensaries" className="hover:text-blacklist-accent-red transition-colors">
              Dispensaries
            </Link>
            <Link href="/news" className="hover:text-blacklist-accent-red transition-colors">
              News
            </Link>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-primary text-xs">Sign In</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main>
        <Hero />
        <ProductGallery />
        <ProductForums />
        <NewsFeed />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}