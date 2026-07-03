import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export const metadata = {
  title: 'Create Forum Post - The Green List',
  description: 'Start a discussion in The Green List forums',
}

export default function ForumsNewPage() {
  return (
    <div className="min-h-screen smoke-surface flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="glow-border rounded-lg p-px mb-12">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Create Forum Post</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold md:text-5xl">
              Join the Community Conversation
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Participate in moderated discussions about cannabis transparency, consumer safety, industry accountability, and community trust.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/auth/signin?callbackUrl=/forums/new">
            <Card className="h-full hover:bg-accent/5 transition-all cursor-pointer border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🗣️</span>
                  Consumer Safety
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Discuss product testing, contamination concerns, health and safety issues.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/auth/signin?callbackUrl=/forums/new">
            <Card className="h-full hover:bg-accent/5 transition-all cursor-pointer border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">💼</span>
                  Industry Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Examine business practices, pricing transparency, service quality, and accountability.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/auth/signin?callbackUrl=/forums/new">
            <Card className="h-full hover:bg-accent/5 transition-all cursor-pointer border-primary/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">⚖️</span>
                  Legal & Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Discuss regulations, legal updates, policy changes, and compliance matters.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <section className="max-w-2xl mx-auto mb-12">
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>Forum Guidelines</CardTitle>
              <CardDescription>Keep discussions productive and respectful</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-l-4 border-accent pl-4">
                <h4 className="font-semibold text-accent mb-1">Be Constructive</h4>
                <p className="text-sm text-muted-foreground">
                  Focus on sharing knowledge, experiences, and insights that help the community.
                </p>
              </div>
              <div className="border-l-4 border-accent pl-4">
                <h4 className="font-semibold text-accent mb-1">Cite Your Sources</h4>
                <p className="text-sm text-muted-foreground">
                  When discussing facts or data, include links or references where possible.
                </p>
              </div>
              <div className="border-l-4 border-accent pl-4">
                <h4 className="font-semibold text-accent mb-1">Respect Privacy</h4>
                <p className="text-sm text-muted-foreground">
                  Do not share personal information or doxx individuals. Focus on public accountability.
                </p>
              </div>
              <div className="border-l-4 border-accent pl-4">
                <h4 className="font-semibold text-accent mb-1">No Misinformation</h4>
                <p className="text-sm text-muted-foreground">
                  Avoid unsubstantiated claims. Stick to verifiable facts and labeled opinion.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="max-w-2xl mx-auto">
          <Link href="/auth/signin?callbackUrl=/forums/new">
            <button className="w-full px-6 py-4 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors">
              Sign In to Create a Post
            </button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
