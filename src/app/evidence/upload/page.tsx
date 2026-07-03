import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata = {
  title: 'Upload Evidence - The Green List',
  description: 'Upload photos, receipts, and documentation to support your report',
}

export default function EvidenceUploadPage() {
  return (
    <div className="min-h-screen smoke-surface flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="glow-border rounded-lg p-px mb-12">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Upload Evidence</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold md:text-5xl">
              Document Your Report with Supporting Evidence
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Upload photos, receipts, product labels, screenshots, and other documentation that supports your transparency report. All submissions are reviewed securely and privately.
            </p>
          </div>
        </section>

        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>Evidence Upload Center</CardTitle>
              <CardDescription>Secure document submission for authenticated users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Link href="/auth/signin?callbackUrl=/evidence/upload">
                <button className="w-full px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors">
                  Sign In to Upload Evidence
                </button>
              </Link>

              <div className="border-t border-primary/20 pt-6">
                <h3 className="text-lg font-semibold text-accent mb-4">What You Can Upload</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <span>Product labels and packaging photos</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <span>Receipts and transaction documentation</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <span>Screenshots of communications or listings</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <span>Lab test results or third-party documentation</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <span>Photos of relevant locations or items</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-primary/20 pt-6">
                <h3 className="text-lg font-semibold text-accent mb-4">Privacy & Security</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• All evidence is stored securely and encrypted</li>
                  <li>• Evidence is visible only to moderators and authorized reviewers</li>
                  <li>• Public reports do not expose your personal information</li>
                  <li>• You control anonymity settings for your submission</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <section className="mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                Private & Secure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Evidence files are encrypted and accessible only by authorized moderators and reviewers.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">⚖️</span>
                Verified Before Public
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Evidence undergoes review before any report is published to ensure accuracy and fairness.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">📋</span>
                You Control Anonymity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Choose whether your submission is public, attributed, or completely anonymous.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  )
}
