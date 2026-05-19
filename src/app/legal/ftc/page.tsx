import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

export const metadata = {
  title: 'FTC Disclosures - THEBLACKLIST.ONLINE',
  description: 'FTC disclosures, affiliate clarity, and anti-commerce compliance for THEBLACKLIST.ONLINE.',
}

const lastUpdated = 'May 2026'

export default function FTCPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-blacklist-dark pt-8 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-invert">
            <h1 className="text-4xl font-bold text-white mb-6">FTC Disclosure & Affiliate Policy</h1>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 mb-10">
              <p className="text-white text-lg font-semibold mb-3">
                This page explains how THEBLACKLIST.ONLINE uses affiliate links and sponsored content while maintaining a strict non-commerce policy.
              </p>
              <p className="text-muted-foreground">
                THEBLACKLIST.ONLINE is a cannabis industry transparency platform. We do not sell cannabis, process payments, arrange delivery,
                or act as an e-commerce marketplace.
              </p>
            </div>

            <div className="space-y-10 text-muted-foreground">
              <section>
                <h2 className="text-2xl font-bold text-white mb-3">1. FTC Compliance</h2>
                <p>
                  THEBLACKLIST.ONLINE complies with the Federal Trade Commission's Endorsement Guides (16 CFR Part 255).
                  We clearly disclose affiliate relationships and paid placements. This policy explains what is promoted, how it is labeled,
                  and how we keep the platform legally separate from cannabis commerce.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">2. Affiliate Link Disclosure</h2>
                <p>
                  Some links on THEBLACKLIST.ONLINE may be affiliate links. When you click an affiliate link and make a qualifying purchase,
                  we may earn a commission at no additional cost to you.
                </p>
                <p className="mt-3">
                  <strong>Affiliate link signals include:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Explicit labels such as "Affiliate Link" or "We earn a commission"</li>
                  <li>Disclosure copy near the link or button</li>
                  <li>Dedicated disclosure banners or sidebars on the page</li>
                </ul>
                <p className="mt-3">
                  <strong>Important:</strong> Affiliate relationships are limited to ancillary products, services, legal resources, and education.
                  We do not earn commissions from direct cannabis sales, dispensary purchases, or product delivery transactions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">3. Sponsored Content</h2>
                <p>
                  Sponsored content on THEBLACKLIST.ONLINE is paid content and is clearly labeled as such. This includes promoted business profiles,
                  sponsored articles, native advertising, and partner features.
                </p>
                <p className="mt-3">
                  <strong>Sponsored content practices:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Visible disclosure near the headline or call-to-action</li>
                  <li>Labels such as "Sponsored," "Paid Partnership," or "Promoted"</li>
                  <li>Consistent separation from editorial and forum content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">4. Editorial Independence</h2>
                <p>
                  We maintain a strict editorial firewall between paid content and our community-driven transparency platform.
                  Affiliate relationships and sponsorships do not influence our coverage, review systems, moderation policies, or legal disclosures.
                </p>
                <p className="mt-3">
                  Our editorial content includes user reviews, investigative reports, forum summaries, and legal resources.
                  Those sections remain independent unless a sponsorship or affiliate relationship is explicitly disclosed.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">5. User-Generated Content</h2>
                <p>
                  Reviews, forum posts, transparency reports, and community submissions are user-generated content.
                  They are not sponsored unless explicitly stated. THEBLACKLIST.ONLINE does not verify every claim and is not responsible
                  for the accuracy of user statements.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">6. No Direct Cannabis Commerce</h2>
                <p>
                  THEBLACKLIST.ONLINE does not participate in, facilitate, or profit from cannabis product sales.
                  We do not store inventory, process cannabis payments, coordinate deliveries, or transact cannabis on behalf of users.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
                  <li>We do not sell cannabis products</li>
                  <li>We do not ship cannabis products</li>
                  <li>We do not earn commission on cannabis purchases</li>
                  <li>We do not arrange or coordinate cannabis transactions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">7. Allowed Affiliate Categories</h2>
                <p>
                  Affiliate relationships on THEBLACKLIST.ONLINE are limited to categories consistent with our mission and legal boundaries.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Compliance and legal services</li>
                  <li>Harm reduction and safety education</li>
                  <li>Industry business tools and analytics</li>
                  <li>Ancillary products and technology</li>
                  <li>Research, training, and policy resources</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">8. Compliance Reporting</h2>
                <p>
                  If you believe a page on THEBLACKLIST.ONLINE has failed to disclose a sponsored relationship or affiliate link,
                  or if you identify misleading content, report it immediately.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email: compliance@theblacklist.online</li>
                  <li>FTC complaint portal: reportfraud.ftc.gov</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">9. Policy Changes</h2>
                <p>
                  This disclosure policy may be updated at any time to reflect regulatory changes, new best practices, or changes to our affiliate program.
                  Revisions take effect when posted on this page.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">10. Contact</h2>
                <p>
                  For questions about our affiliate practices, sponsored content, or FTC compliance, contact compliance@theblacklist.online.
                </p>
              </section>

              <div className="text-sm text-muted-foreground mt-12 pt-6 border-t border-muted">
                <p>Last Updated: {lastUpdated}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
