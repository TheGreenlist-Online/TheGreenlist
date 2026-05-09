import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

export const metadata = {
  title: 'Privacy Policy - THEBLACKLIST.ONLINE',
  description: 'Privacy Policy for THEBLACKLIST.ONLINE platform.',
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-blacklist-dark pt-8 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-invert">
            <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-2xl font-bold text-white mb-3">1. Introduction</h2>
                <p>
                  THEBLACKLIST.ONLINE ("we," "us," "our," or "Company") is committed to protecting your privacy.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">2. Information We Collect</h2>
                <h3 className="text-xl font-semibold text-white/80 mt-3 mb-2">Account Information</h3>
                <p>
                  When you create an account via Clerk authentication, we collect: email address, name, and profile information you provide.
                </p>
                <h3 className="text-xl font-semibold text-white/80 mt-3 mb-2">User-Generated Content</h3>
                <p>
                  We collect and store all content you post, including forum posts, reviews, and comments.
                </p>
                <h3 className="text-xl font-semibold text-white/80 mt-3 mb-2">Usage Data</h3>
                <p>
                  We collect automatically: IP address, browser type, pages visited, time spent, referral URL, and device information via cookies and analytics.
                </p>
                <h3 className="text-xl font-semibold text-white/80 mt-3 mb-2">Communications</h3>
                <p>
                  If you contact us, we collect and retain your messages and responses.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">3. How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide, operate, and improve the Platform</li>
                  <li>Authenticate your account (via Clerk)</li>
                  <li>Send notifications about your account or activity</li>
                  <li>Analyze Platform usage and trends</li>
                  <li>Detect and prevent fraud or abuse</li>
                  <li>Comply with legal obligations</li>
                  <li>Enforce our Terms of Service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">4. Data Sharing</h2>
                <h3 className="text-xl font-semibold text-white/80 mt-3 mb-2">Public Content</h3>
                <p>
                  All user-generated content (reviews, forum posts) is public and searchable. Your name or username is displayed with your content.
                </p>
                <h3 className="text-xl font-semibold text-white/80 mt-3 mb-2">Service Providers</h3>
                <p>
                  We share data with: Clerk (authentication), Supabase/PostgreSQL (database), Vercel (hosting), and analytics providers.
                  All providers have contractual data protection obligations.
                </p>
                <h3 className="text-xl font-semibold text-white/80 mt-3 mb-2">Legal Compliance</h3>
                <p>
                  We may disclose your information if required by law, court order, or to protect our rights and safety.
                </p>
                <h3 className="text-xl font-semibold text-white/80 mt-3 mb-2">Business Transfers</h3>
                <p>
                  If THEBLACKLIST.ONLINE is acquired or sold, your information may be transferred as part of that transaction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">5. Data Retention</h2>
                <p>
                  We retain account information as long as your account is active or as needed to provide services.
                  We retain user-generated content indefinitely unless you request deletion (subject to legal holds).
                  Usage and analytics data is retained for up to 2 years.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">6. Data Security</h2>
                <p>
                  We implement industry-standard security measures including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>HTTPS/TLS encryption for data in transit</li>
                  <li>Encryption at rest (database)</li>
                  <li>Secure password hashing via Clerk</li>
                  <li>Regular security updates and patches</li>
                  <li>Access controls and authentication</li>
                </ul>
                <p className="mt-3">
                  <strong>Note:</strong> No security is 100% impenetrable. We cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">7. Your Rights</h2>
                <h3 className="text-xl font-semibold text-white/80 mt-3 mb-2">Access</h3>
                <p>You can access your account information anytime by logging in.</p>
                <h3 className="text-xl font-semibold text-white/80 mt-3 mb-2">Correction</h3>
                <p>You can update your profile information in your account settings.</p>
                <h3 className="text-xl font-semibold text-white/80 mt-3 mb-2">Deletion</h3>
                <p>
                  You can request deletion of your account and associated private information.
                  Your public content (posts, reviews) will remain visible unless removed for policy violations.
                </p>
                <h3 className="text-xl font-semibold text-white/80 mt-3 mb-2">Do Not Track</h3>
                <p>
                  We honor "Do Not Track" signals but cannot guarantee all third parties do.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">8. Cookies & Tracking</h2>
                <p>
                  We use cookies for authentication, preferences, and analytics.
                  You can disable cookies in your browser settings, but some features may not work.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">9. Third-Party Links</h2>
                <p>
                  THEBLACKLIST.ONLINE may contain links to external websites.
                  We are not responsible for their privacy practices. Review their policies before sharing information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">10. CCPA Compliance (California)</h2>
                <p>
                  If you are a California resident, you have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Know what personal information is collected</li>
                  <li>Know whether personal information is sold or disclosed</li>
                  <li>Delete personal information (with exceptions)</li>
                  <li>Opt-out of the sale or sharing of personal information</li>
                </ul>
                <p className="mt-3">
                  To exercise these rights, email: privacy@theblacklist.online
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">11. GDPR Compliance (EU)</h2>
                <p>
                  If you are in the EU, you have rights under GDPR including access, rectification, erasure, and data portability.
                  For requests, contact: privacy@theblacklist.online
                </p>
                <p className="mt-3">
                  We process personal data based on consent (your account creation) and legitimate business interests.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">12. Children's Privacy</h2>
                <p>
                  THEBLACKLIST.ONLINE is not intended for users under 21 (or your jurisdiction's legal age).
                  We do not knowingly collect information from minors. If we become aware of underage use, we will delete their account immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">13. Policy Changes</h2>
                <p>
                  We may update this Privacy Policy periodically. Changes become effective when posted.
                  Your continued use of the Platform constitutes acceptance of changes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">14. Contact</h2>
                <p>
                  For privacy questions or requests, contact: privacy@theblacklist.online
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
