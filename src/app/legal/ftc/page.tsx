import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

export const metadata = {
  title: 'FTC Disclosures - THEBLACKLIST.ONLINE',
  description: 'FTC Disclosures for THEBLACKLIST.ONLINE affiliate links and sponsored content.',
}

export default function FTCPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-blacklist-dark pt-8 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-invert">
            <h1 className="text-4xl font-bold text-white mb-8">FTC Disclosure & Affiliate Policy</h1>

            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-2xl font-bold text-white mb-3">1. FTC Compliance</h2>
                <p>
                  THEBLACKLIST.ONLINE complies with the Federal Trade Commission (FTC) Guidelines on Endorsements and Testimonials
                  (16 CFR Part 255). This policy details how we handle affiliate links and sponsored content.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">2. Affiliate Link Disclosure</h2>
                <p>
                  THEBLACKLIST.ONLINE may contain affiliate links where we earn a commission if you click and purchase.
                </p>
                <p className="mt-3">
                  <strong>How to identify affiliate links:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Links labeled "Affiliate Link" or "We earn a commission"</li>
                  <li>Links with [affiliate] notation</li>
                  <li>Outbound links to partner sites in dedicated disclosure sections</li>
                </ul>
                <p className="mt-3">
                  <strong>Our Commitment:</strong> We ONLY recommend products, services, and resources we genuinely believe provide value.
                  Affiliate relationships do not change our editorial standards or recommendations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">3. Sponsored Content</h2>
                <p>
                  Any content clearly marked as "Sponsored," "Paid Partnership," or "Promoted" is paid advertising.
                </p>
                <p className="mt-3">
                  <strong>Sponsored content is:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Clearly labeled with visible disclosure near the headline</li>
                  <li>Visually distinct from editorial content</li>
                  <li>Never deceptive or hidden</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">4. No False Claims</h2>
                <p>
                  THEBLACKLIST.ONLINE does NOT make or endorse:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Unverified medical or health claims</li>
                  <li>Illegal therapeutic claims</li>
                  <li>Deceptive or misleading statements</li>
                  <li>Claims that violate cannabis regulations</li>
                </ul>
                <p className="mt-3">
                  All health or therapeutic information is for educational purposes.
                  Consult healthcare professionals for medical advice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">5. Separation of Editorial & Advertising</h2>
                <p>
                  We maintain clear separation between editorial content and paid advertisements.
                </p>
                <p className="mt-3">
                  <strong>Editorial Content (not paid):</strong> Reviews, news, forum discussions, and educational articles
                  are created by our community and team based on accuracy and value.
                </p>
                <p>
                  <strong>Sponsored Content (paid):</strong> Clearly labeled advertisements, partner features, and promoted listings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">6. User-Generated Reviews</h2>
                <p>
                  All user-generated reviews (strain reviews, dispensary reviews, product reviews) are submitted by community members.
                  These are NOT sponsored or paid unless explicitly stated. The views expressed are those of the reviewer, not THEBLACKLIST.ONLINE.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">7. Testimonials & Endorsements</h2>
                <p>
                  Any testimonials or endorsements reflect the genuine experience of the reviewer.
                  Results may vary. We do not guarantee that everyone will have similar experiences.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">8. Affiliate Partner List</h2>
                <p>
                  THEBLACKLIST.ONLINE may have affiliate relationships with:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Cannabis education platforms</li>
                  <li>Accessory retailers</li>
                  <li>Harm reduction organizations</li>
                  <li>Legal resources</li>
                  <li>Cannabis business services</li>
                </ul>
                <p className="mt-3">
                  <strong>CRITICAL DISCLAIMER:</strong> Affiliate relationships do NOT include cannabis retailers, dispensaries, or direct product sales.
                  THEBLACKLIST.ONLINE does NOT receive commissions from cannabis purchases.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">9. Cannabis Industry Compliance</h2>
                <p>
                  THEBLACKLIST.ONLINE operates within cannabis industry regulatory guidelines:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We do NOT facilitate cannabis sales</li>
                  <li>We do NOT ship cannabis products</li>
                  <li>We do NOT earn commissions from cannabis transactions</li>
                  <li>We do NOT make unverified medical claims</li>
                  <li>We do NOT target minors</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">10. How to Report Violations</h2>
                <p>
                  If you believe THEBLACKLIST.ONLINE has made false claims, hidden affiliate links, or violated FTC guidelines,
                  please report it immediately:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email: compliance@theblacklist.online</li>
                  <li>File a complaint with the FTC: reportfraud.ftc.gov</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">11. Policy Updates</h2>
                <p>
                  THEBLACKLIST.ONLINE may update this disclosure policy to comply with new regulations or best practices.
                  Changes will be posted on this page.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">12. Contact</h2>
                <p>
                  For questions about affiliate links or sponsored content, contact: compliance@theblacklist.online
                </p>
              </section>

              <div className="text-sm text-muted-foreground mt-12 pt-6 border-t border-muted">
                <p>Last Updated: January 2025</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
