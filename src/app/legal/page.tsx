import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

export const metadata = {
  title: 'Legal & Compliance - THEBLACKLIST.ONLINE',
  description: 'Legal information, policies, and compliance documentation for THEBLACKLIST.ONLINE',
}

export default function LegalHub() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-blacklist-dark pt-8 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-white mb-4">Legal & Compliance</h1>
              <p className="text-xl text-muted-foreground">
                Important information about THEBLACKLIST.ONLINE and our platform.
              </p>
            </div>

            {/* Critical Notice */}
            <Card className="mb-8 border-blacklist-accent-red/50 bg-blacklist-accent-red/5">
              <CardHeader>
                <CardTitle className="text-blacklist-accent-red">⚠️ Critical Notice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>THEBLACKLIST.ONLINE is NOT a cannabis marketplace, dispensary, or e-commerce platform.</strong>
                </p>
                <p>
                  We do NOT sell, distribute, ship, arrange deliveries for, or facilitate the sale of cannabis products in any form.
                  Our platform is solely for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Educational content and industry transparency</li>
                  <li>Community forums and user discussions</li>
                  <li>Public reviews and feedback (user-generated)</li>
                  <li>Dispensary information and business profiles</li>
                  <li>News and industry reporting</li>
                  <li>Accountability and public oversight</li>
                </ul>
              </CardContent>
            </Card>

            {/* Legal Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <Link href="/legal/terms">
                <Card className="h-full hover:bg-blacklist-green/10 transition-colors cursor-pointer border-blacklist-green">
                  <CardHeader>
                    <CardTitle>Terms of Service</CardTitle>
                    <CardDescription>Platform usage terms and conditions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Read our terms governing your use of THEBLACKLIST.ONLINE, including user responsibilities and limitations.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/legal/privacy">
                <Card className="h-full hover:bg-blacklist-green/10 transition-colors cursor-pointer border-blacklist-green">
                  <CardHeader>
                    <CardTitle>Privacy Policy</CardTitle>
                    <CardDescription>How we collect and use your data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Learn how THEBLACKLIST.ONLINE collects, processes, and protects your personal information.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/legal/ftc">
                <Card className="h-full hover:bg-blacklist-green/10 transition-colors cursor-pointer border-blacklist-green">
                  <CardHeader>
                    <CardTitle>FTC Disclosures</CardTitle>
                    <CardDescription>Sponsored content and affiliate links</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Information about affiliate partnerships, sponsored content, and compliance with FTC guidelines.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/legal/dmca">
                <Card className="h-full hover:bg-blacklist-green/10 transition-colors cursor-pointer border-blacklist-green">
                  <CardHeader>
                    <CardTitle>DMCA Policy</CardTitle>
                    <CardDescription>Copyright and intellectual property</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Our Digital Millennium Copyright Act (DMCA) policy and copyright takedown procedures.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Compliance Info */}
            <Card className="border-blacklist-green/50 bg-blacklist-green/5 mb-8">
              <CardHeader>
                <CardTitle>Compliance & Governance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Age Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    By using THEBLACKLIST.ONLINE, you confirm that you are at least 21 years of age or meet the minimum legal age in your jurisdiction. Content is for adults only.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Legal Compliance</h3>
                  <p className="text-sm text-muted-foreground">
                    THEBLACKLIST.ONLINE complies with all applicable federal, state, and local laws. We do not facilitate any illegal activities. Cannabis regulations vary by jurisdiction—consult local authorities.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">User-Generated Content</h3>
                  <p className="text-sm text-muted-foreground">
                    All reviews, forum posts, and community submissions are user-generated. THEBLACKLIST.ONLINE does not verify claims and is not responsible for accuracy. Content is published as-is for community discussion.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Moderation & Safety</h3>
                  <p className="text-sm text-muted-foreground">
                    We maintain community standards and moderate content to prevent harassment, hate speech, defamation, and illegal activity. See our Terms for details on enforcement.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Legal & Compliance Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">Send legal notices, takedown requests, or compliance questions to:</p>
                  <p className="text-sm text-muted-foreground mt-2">legal@theblacklist.online</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Response time: 5-10 business days for DMCA takedown requests and legal inquiries.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
