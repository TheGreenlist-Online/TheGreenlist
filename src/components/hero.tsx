export function Hero() {
  return (
    <section className="py-24 px-4 bg-gradient-to-b from-blacklist-gray to-blacklist-dark">
      <div className="container mx-auto text-center">
        <h1 className="heading-lg mb-6">
          THEBLACKLIST
        </h1>
        <div className="text-2xl md:text-3xl font-bold text-blacklist-accent-yellow mb-6">
          ━━━━━━━━━━━━━━━━
        </div>
        <p className="text-xl md:text-2xl mb-8 text-blacklist-text max-w-3xl mx-auto font-light">
          Transparent. Authentic. Community-Driven.
        </p>
        <p className="text-base md:text-lg mb-12 text-muted max-w-2xl mx-auto">
          Your trusted platform for cannabis industry transparency, product reviews, and real conversations with the community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="btn-primary text-lg px-8 py-3">
            Explore Community
          </button>
          <button className="btn-secondary text-lg px-8 py-3">
            Browse Products
          </button>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="card-elevated p-6 rounded-lg">
            <h3 className="text-blacklist-accent-yellow font-semibold mb-2">Trusted Reviews</h3>
            <p className="text-sm text-muted">Real user feedback on products and strains</p>
          </div>
          <div className="card-elevated p-6 rounded-lg">
            <h3 className="text-blacklist-accent-yellow font-semibold mb-2">Active Community</h3>
            <p className="text-sm text-muted">Join discussions from cannabis enthusiasts</p>
          </div>
          <div className="card-elevated p-6 rounded-lg">
            <h3 className="text-blacklist-accent-yellow font-semibold mb-2">Industry Insights</h3>
            <p className="text-sm text-muted">Stay updated on cannabis policy and news</p>
          </div>
        </div>
      </div>
    </section>
  )
}