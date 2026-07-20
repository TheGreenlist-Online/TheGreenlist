import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata = {
  title: 'Submit a Report - The Green List',
  description: 'Submit a transparency report with evidence and documentation',
}

export default function ReportsNewPage() {
  return (
    <div className="min-h-screen smoke-surface flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="glow-border rounded-lg p-px mb-12">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Submit a Report</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold md:text-5xl">
              Transparency Through Documented Accountability
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Share your experience with evidence, context, and documentation to help the cannabis community understand and address accountability issues.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Link href="/auth/signin?callbackUrl=/reports/new">
            <Card className="h-full hover:bg-accent/5 transition-all cursor-pointer border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  Start a Report
                </CardTitle>
                <CardDescription>Create a new transparency report</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Document consumer concerns, service issues, product quality problems, pricing practices, or other accountability matters with evidence.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/auth/signin?callbackUrl=/evidence/upload">
            <Card className="h-full hover:bg-accent/5 transition-all cursor-pointer border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📸</span>
                  Upload Evidence
                </CardTitle>
                <CardDescription>Add supporting documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Include photos, receipts, screenshots, product labels, or other documentation that supports your report.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/forums/new">
            <Card className="h-full hover:bg-accent/5 transition-all cursor-pointer border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💬</span>
                  Join Discussion
                </CardTitle>
                <CardDescription>Community forums and topics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Participate in moderated discussions about cannabis accountability, consumer safety, industry practices, and policy.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/education/new">
            <Card className="h-full hover:bg-accent/5 transition-all cursor-pointer border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📚</span>
                  Share Resources
                </CardTitle>
                <CardDescription>Educational content and guides</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Submit educational resources, safety guides, regulatory information, or awareness content for the community.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <section className="mt-12 glow-border rounded-lg p-px">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-8">
            <h2 className="text-2xl font-bold mb-6">Reporting Guidelines</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-accent mb-3">Be Specific</h3>
                <p className="text-sm text-muted-foreground">
                  Include dates, locations, business names, and specific details about what happened.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-accent mb-3">Use Evidence</h3>
                <p className="text-sm text-muted-foreground">
                  Provide documentation like photos, receipts, screenshots, or product labels when possible.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-accent mb-3">Stay Factual</h3>
                <p className="text-sm text-muted-foreground">
                  Focus on observable facts and experiences. Avoid speculation or unsubstantiated claims.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
