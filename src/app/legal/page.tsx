import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

export const metadata = {
  title: 'Legal & Compliance - The Green List',
  description: 'Legal information, policies, and compliance documentation for The Green List',
}

export default function LegalHub() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-8 pb-20 text-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-4">Legal & Compliance</h1>
              <p className="text-xl text-muted-foreground">
                Important information about The Green List and our platform.
              </p>
            </div>

            <Card className="mb-8 border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">Critical Notice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>The Green List is not a cannabis marketplace, dispensary, or e-commerce platform.</strong>
                </p>
                <p>
                  We do not sell, distribute, ship, arrange deliveries for, order, or facilitate the sale of cannabis products in any form.
                  Our platform is solely for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Educational content and industry transparency</li>
                  <li>Community forums and user discussions</li>
                  <li>Public reports and user-generated feedback</li>
                  <li>Business information and accountability records</li>
                  <li>News and industry reporting</li>
                  <li>Accountability and public oversight</li>
                </ul>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <Link href="/legal/terms">
                <Card className="h-full hover:bg-accent/10 transition-colors cursor-pointer border-primary/40">
                  <CardHeader>
                    <CardTitle>Terms of Service</CardTitle>
                    <CardDescription>Platform usage terms and conditions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Read our terms governing your use of The Green List, including user responsibilities and limitations.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/legal/privacy">
                <Card className="h-full hover:bg-accent/10 transition-colors cursor-pointer border-primary/40">
                  <CardHeader>
                    <CardTitle>Privacy Policy</CardTitle>
                    <CardDescription>How we collect and use your data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Learn how The Green List collects, processes, and protects your personal information.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/legal/ftc">
                <Card className="h-full hover:bg-accent/10 transition-colors cursor-pointer border-primary/40">
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
                <Card className="h-full hover:bg-accent/10 transition-colors cursor-pointer border-primary/40">
                  <CardHeader>
                    <CardTitle>DMCA Policy</CardTitle>
                    <CardDescription>Copyright and intellectual property</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Our Digital Millennium Copyright Act policy and copyright takedown procedures.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <Card className="border-primary/40 bg-primary/5 mb-8">
              <CardHeader>
                <CardTitle>Compliance & Governance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Age Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    By using The Green List, you confirm that you are at least 21 years of age or meet the minimum legal age in your jurisdiction. Content is for adults only.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Legal Compliance</h3>
                  <p className="text-sm text-muted-foreground">
                    The Green List complies with applicable federal, state, and local laws. We do not facilitate illegal activities. Cannabis regulations vary by jurisdiction, so consult local authorities.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">User-Generated Content</h3>
                  <p className="text-sm text-muted-foreground">
                    All reviews, forum posts, reports, and community submissions are user-generated. Content is published for community discussion and accountability review.
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

            <Card>
              <CardHeader>
                <CardTitle>Legal & Compliance Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">Send legal notices, takedown requests, or compliance questions to:</p>
                  <p className="text-sm text-muted-foreground mt-2">legal@thegreenlist.online</p>
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
