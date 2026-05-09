import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

export const metadata = {
  title: 'Terms of Service - THEBLACKLIST.ONLINE',
  description: 'Terms of Service for THEBLACKLIST.ONLINE platform.',
}

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-blacklist-dark pt-8 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-invert">
            <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>

            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-2xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using THEBLACKLIST.ONLINE ("Platform"), you agree to be bound by these Terms of Service.
                  If you do not agree to any part of these terms, you may not use our Platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">2. Description of Service</h2>
                <p>
                  THEBLACKLIST.ONLINE is a cannabis industry transparency and community platform providing:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Community forums and discussion channels</li>
                  <li>User-generated reviews and feedback</li>
                  <li>Business profiles and dispensary information</li>
                  <li>Educational content and industry news</li>
                  <li>Public accountability reporting</li>
                </ul>
                <p className="mt-3">
                  <strong>CRITICAL:</strong> THEBLACKLIST.ONLINE is NOT a marketplace, e-commerce platform, or sales channel.
                  We do NOT sell, distribute, ship, or facilitate the sale of cannabis products.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">3. Age Requirements</h2>
                <p>
                  You must be at least 21 years of age (or meet the minimum legal age in your jurisdiction) to access this Platform.
                  You represent and warrant that you meet this requirement. We reserve the right to verify age and suspend access for non-compliance.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">4. User Accounts</h2>
                <p>
                  To access certain features, you may be required to create an account through Clerk authentication.
                  You agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the confidentiality of your password</li>
                  <li>Take responsibility for all activities under your account</li>
                  <li>Not impersonate others or create fraudulent accounts</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">5. User-Generated Content</h2>
                <p>
                  You are solely responsible for any content you post, including reviews, forum posts, and submissions.
                  By posting, you grant THEBLACKLIST.ONLINE a non-exclusive license to use, reproduce, and display your content.
                </p>
                <p className="mt-3">
                  <strong>Prohibited Content:</strong> You may NOT post content that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Defames, harasses, or threatens individuals</li>
                  <li>Violates intellectual property rights</li>
                  <li>Contains illegal activity or promotes violence</li>
                  <li>Is spam, phishing, or malware</li>
                  <li>Violates local, state, or federal laws</li>
                  <li>Constitutes false or misleading information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">6. Accuracy Disclaimer</h2>
                <p>
                  All user-generated content (reviews, posts, comments) is submitted by community members and is NOT verified by THEBLACKLIST.ONLINE.
                  We do NOT warrant the accuracy, completeness, or reliability of any user content.
                  Use community information at your own discretion and verify independently.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">7. No Medical or Legal Advice</h2>
                <p>
                  Content on THEBLACKLIST.ONLINE is for informational and educational purposes only.
                  It does NOT constitute medical, legal, or professional advice.
                  Consult qualified healthcare providers for medical questions and licensed attorneys for legal advice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">8. Legal Compliance</h2>
                <p>
                  By using this Platform, you agree to comply with all applicable federal, state, and local laws regarding cannabis.
                  Cannabis regulations vary significantly by jurisdiction. You are responsible for understanding your local laws.
                  THEBLACKLIST.ONLINE is not responsible for your legal compliance.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">9. Moderation & Enforcement</h2>
                <p>
                  THEBLACKLIST.ONLINE reserves the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Remove content that violates these Terms</li>
                  <li>Suspend or terminate user accounts for violations</li>
                  <li>Restrict access to certain features</li>
                  <li>Cooperate with law enforcement when required</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">10. Limitation of Liability</h2>
                <p>
                  TO THE FULLEST EXTENT PERMITTED BY LAW, THEBLACKLIST.ONLINE IS PROVIDED "AS IS" WITHOUT WARRANTIES.
                  WE DISCLAIM ALL IMPLIED WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                  IN NO EVENT SHALL THEBLACKLIST.ONLINE BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">11. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless THEBLACKLIST.ONLINE from any claims, damages, or costs arising from:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your violation of these Terms</li>
                  <li>Your use of the Platform</li>
                  <li>Content you post or submit</li>
                  <li>Your violation of any laws or third-party rights</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">12. Changes to Terms</h2>
                <p>
                  THEBLACKLIST.ONLINE may update these Terms at any time. Continued use of the Platform constitutes acceptance
                  of updated Terms. It is your responsibility to review changes regularly.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">13. Contact</h2>
                <p>
                  For questions about these Terms, contact: legal@theblacklist.online
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
