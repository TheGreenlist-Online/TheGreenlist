import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata = {
  title: 'Submit Educational Content - The Green List',
  description: 'Share educational resources and guides for the community',
}

export default function EducationNewPage() {
  return (
    <div className="min-h-screen smoke-surface flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="glow-border rounded-lg p-px mb-12">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Educational Content</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold md:text-5xl">
              Share Knowledge & Community Resources
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Submit educational content, guides, research summaries, and resources that help the community understand cannabis transparency, safety, regulations, and accountability.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
          <Link href="/auth/signin?callbackUrl=/education/new">
            <Card className="h-full hover:bg-accent/5 transition-all cursor-pointer border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🛡️</span>
                  Safety Guide
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create guides about product safety, testing standards, contamination prevention, and consumer protection.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/auth/signin?callbackUrl=/education/new">
            <Card className="h-full hover:bg-accent/5 transition-all cursor-pointer border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">⚖️</span>
                  Regulatory Resource
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share information about cannabis regulations, legal frameworks, compliance requirements, and policy updates.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/auth/signin?callbackUrl=/education/new">
            <Card className="h-full hover:bg-accent/5 transition-all cursor-pointer border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  Worker Rights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Document worker protection resources, labor rights, fair practices, and industry standards.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/auth/signin?callbackUrl=/education/new">
            <Card className="h-full hover:bg-accent/5 transition-all cursor-pointer border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Research Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Summarize research findings, studies, and data relevant to cannabis accountability and transparency.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <section className="max-w-2xl mx-auto mb-12">
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>Content Standards</CardTitle>
              <CardDescription>What makes excellent educational content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-accent mb-2">Evidence-Based</h4>
                <p className="text-sm text-muted-foreground">
                  Include citations, research sources, and references where applicable. Clearly distinguish between fact and opinion.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-accent mb-2">Accessible</h4>
                <p className="text-sm text-muted-foreground">
                  Write for a general audience. Explain technical concepts clearly without oversimplifying.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-accent mb-2">Impartial</h4>
                <p className="text-sm text-muted-foreground">
                  Present multiple perspectives. Avoid commercial promotion or biased advocacy.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-accent mb-2">Current</h4>
                <p className="text-sm text-muted-foreground">
                  Use recent, accurate information. Update your content if regulations or facts change.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="max-w-2xl mx-auto">
          <Link href="/auth/signin?callbackUrl=/education/new">
            <button className="w-full px-6 py-4 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors">
              Sign In to Submit Content
            </button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
