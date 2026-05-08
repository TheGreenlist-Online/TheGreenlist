import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-blacklist-gray/60 py-12 px-4 border-t border-blacklist-gray-light/20">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-blacklist-accent-yellow font-bold mb-4">THEBLACKLIST</h3>
            <p className="text-muted text-sm">
              Your trusted platform for cannabis community, reviews, and transparency.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-blacklist-text mb-4">Browse</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/products" className="hover:text-blacklist-accent-red transition-colors">Products</Link></li>
              <li><Link href="/forums" className="hover:text-blacklist-accent-red transition-colors">Forums</Link></li>
              <li><Link href="/reviews" className="hover:text-blacklist-accent-red transition-colors">Reviews</Link></li>
              <li><Link href="/dispensaries" className="hover:text-blacklist-accent-red transition-colors">Dispensaries</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blacklist-text mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/guidelines" className="hover:text-blacklist-accent-red transition-colors">Guidelines</Link></li>
              <li><Link href="/report" className="hover:text-blacklist-accent-red transition-colors">Report</Link></li>
              <li><Link href="/feedback" className="hover:text-blacklist-accent-red transition-colors">Feedback</Link></li>
              <li><Link href="/contact" className="hover:text-blacklist-accent-red transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blacklist-text mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/terms" className="hover:text-blacklist-accent-red transition-colors">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-blacklist-accent-red transition-colors">Privacy</Link></li>
              <li><Link href="/disclaimer" className="hover:text-blacklist-accent-red transition-colors">Disclaimer</Link></li>
              <li><Link href="/conduct" className="hover:text-blacklist-accent-red transition-colors">Code of Conduct</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-blacklist-gray-light/20 pt-8 text-center text-sm text-muted">
          <p>&copy; 2024 THEBLACKLIST. All rights reserved.</p>
          <p className="mt-2 text-xs">
            Cannabis community platform for transparency and consumer education.
          </p>
        </div>
      </div>
    </footer>
  )
}