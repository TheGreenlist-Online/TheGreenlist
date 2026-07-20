import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata = {
  title: 'Claim Business Profile - The Green List',
  description: 'Verify and manage your business profile on The Green List',
}

export default function BusinessesClaimPage() {
  return (
    <div className="min-h-screen smoke-surface flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="glow-border rounded-lg p-px mb-12">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Business Profile</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold md:text-5xl">
              Claim Your Business Profile
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Verify your cannabis business on The Green List to manage your profile, respond to community discussions, and demonstrate transparency and accountability.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">✓</span>
                Profile Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-accent">→</span>
                  <span>Respond to community reports and discussions</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">→</span>
                  <span>Share transparency information and compliance documentation</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">→</span>
                  <span>Build public trust through accountability</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">→</span>
                  <span>Display verified business status</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                What You&apos;ll Need
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-accent">→</span>
                  <span>Business registration or license documentation</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">→</span>
                  <span>Valid business contact information</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">→</span>
                  <span>Business address and operating details</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-accent">→</span>
                  <span>Authorized representative email</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <section className="max-w-2xl mx-auto mb-12">
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>About Business Profiles</CardTitle>
              <CardDescription>Transparency-first approach to business accountability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-accent mb-2">Not a Marketplace</h4>
                <p className="text-sm text-muted-foreground">
                  The Green List business profiles are for transparency and accountability only. We do not facilitate sales, orders, or transactions.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-accent mb-2">Community Reviewed</h4>
                <p className="text-sm text-muted-foreground">
                  Business profiles include community reports and discussions. Your profile helps you respond to concerns and demonstrate accountability.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-accent mb-2">Verification Matters</h4>
                <p className="text-sm text-muted-foreground">
                  We verify business licenses and registration to ensure legitimate operators. Verified status builds customer confidence.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-accent mb-2">Responsive Required</h4>
                <p className="text-sm text-muted-foreground">
                  Business profile owners are expected to engage professionally and transparently with community feedback.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="max-w-2xl mx-auto">
          <Link href="/auth/signin?callbackUrl=/businesses/claim">
            <button className="w-full px-6 py-4 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors">
              Sign In to Claim Business Profile
            </button>
          </Link>
        </div>
      </main>
    </div>
  )
}
