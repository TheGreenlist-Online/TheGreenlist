import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

export const metadata = {
  title: 'DMCA Policy - THEBLACKLIST.ONLINE',
  description: 'DMCA takedown policy and copyright information for THEBLACKLIST.ONLINE.',
}

export default function DMCAPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-blacklist-dark pt-8 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-invert">
            <h1 className="text-4xl font-bold text-white mb-8">DMCA Policy & Copyright Notice</h1>

            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-2xl font-bold text-white mb-3">1. Copyright Policy</h2>
                <p>
                  THEBLACKLIST.ONLINE respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA).
                  We do not knowingly host or facilitate the distribution of copyrighted material without authorization.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">2. User Content Responsibility</h2>
                <p>
                  Users who post content on THEBLACKLIST.ONLINE ("User-Generated Content") are responsible for ensuring:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>They own or have permission to share the content</li>
                  <li>Content does not infringe copyrights, trademarks, or patents</li>
                  <li>Content does not violate third-party intellectual property rights</li>
                </ul>
                <p className="mt-3">
                  By posting, you grant THEBLACKLIST.ONLINE a non-exclusive license to use the content.
                  You retain ownership of your original content.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">3. Procedure for DMCA Takedown Requests</h2>
                <p>
                  If you believe content on THEBLACKLIST.ONLINE infringes your copyright, send a written notice containing:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your name, email, and mailing address</li>
                  <li>Description of the copyrighted work being infringed</li>
                  <li>Location of the infringing content on our Platform</li>
                  <li>Explanation of why you believe it infringes your copyright</li>
                  <li>Statement that you have a good-faith belief the use is not authorized</li>
                  <li>Statement under penalty of perjury that your information is accurate</li>
                  <li>Your physical or electronic signature</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">4. Submitting a DMCA Takedown Notice</h2>
                <p>
                  Send your DMCA takedown notice to:
                </p>
                <div className="bg-blacklist-green/10 border border-blacklist-green p-4 rounded my-3">
                  <p className="font-semibold">Designated Copyright Agent</p>
                  <p>THEBLACKLIST.ONLINE</p>
                  <p>Email: dmca@theblacklist.online</p>
                  <p className="mt-2 text-sm">Response time: 5-10 business days</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">5. Our Response Process</h2>
                <p>
                  Upon receiving a valid DMCA takedown notice, THEBLACKLIST.ONLINE will:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Verify the request's validity</li>
                  <li>Remove or disable access to the infringing content</li>
                  <li>Notify the content uploader of the takedown</li>
                  <li>Retain records for legal compliance</li>
                </ul>
                <p className="mt-3">
                  We process valid DMCA requests within 5-10 business days.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">6. Counter-Notification</h2>
                <p>
                  If content was removed and you believe it was removed in error or doesn't infringe copyright,
                  you may file a counter-notification:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your name, email, and mailing address</li>
                  <li>Description of content removed</li>
                  <li>Statement under penalty of perjury that removal was error</li>
                  <li>Consent to jurisdiction of federal court</li>
                  <li>Your signature</li>
                </ul>
                <p className="mt-3">
                  Send counter-notices to: dmca@theblacklist.online
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">7. Repeat Infrenments</h2>
                <p>
                  THEBLACKLIST.ONLINE reserves the right to terminate the accounts of users who repeatedly infringe copyrights.
                  Repeated violations may result in permanent suspension and account deletion.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">8. Fair Use</h2>
                <p>
                  Certain uses of copyrighted material may constitute "fair use" under 17 U.S.C. section 107, including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Criticism and commentary</li>
                  <li>News reporting</li>
                  <li>Educational purposes</li>
                  <li>Satire and parody</li>
                </ul>
                <p className="mt-3">
                  We evaluate fair use claims carefully and will not remove content protected by fair use doctrine.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">9. Trademark Policy</h2>
                <p>
                  THEBLACKLIST.ONLINE respects trademark rights. Using others' trademarks without permission is prohibited.
                  For trademark-related concerns, contact: compliance@theblacklist.online
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">10. THEBLACKLIST.ONLINE IP Rights</h2>
                <p>
                  All content created by THEBLACKLIST.ONLINE (design, layout, original articles, source code) is owned by the Company.
                  You may not reproduce, distribute, or modify our content without permission.
                  Users may share content for personal, non-commercial purposes with appropriate attribution.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">11. Attribution</h2>
                <p>
                  When sharing THEBLACKLIST.ONLINE content, please provide proper attribution:
                </p>
                <p className="mt-3">
                  "Original content from THEBLACKLIST.ONLINE" with a link to the source page.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">12. No License Granted</h2>
                <p>
                  Unless explicitly stated, THEBLACKLIST.ONLINE grants no license to any intellectual property.
                  All rights are reserved.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">13. Policy Updates</h2>
                <p>
                  THEBLACKLIST.ONLINE may update this DMCA policy to comply with changing laws and best practices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">14. Contact</h2>
                <p>
                  For all copyright, trademark, and IP concerns:
                </p>
                <p className="mt-3">Email: dmca@theblacklist.online</p>
              </section>

              <div className="text-sm text-muted-foreground mt-12 pt-6 border-t border-muted">
                <p>Last Updated: January 2025</p>
                <p className="mt-2">
                  This policy complies with 17 U.S.C. section 512 (Digital Millennium Copyright Act).
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
