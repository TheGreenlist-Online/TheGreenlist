import Link from 'next/link'
import { FileSearch, FolderLock, ShieldCheck } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Evidence Center - The Green List',
  description: 'Securely submit and manage documentation supporting Green List transparency reports',
}

export default function EvidencePage() {
  return (
    <PageShell>
      <OrnatePanel>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Reports Bureau</p>
        <h1 className="mt-3 text-4xl text-amber-100">Evidence Center</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Securely attach photos, receipts, screenshots, PDFs, and written records to a transparency report.
          Evidence remains private while authorized reviewers evaluate the submission.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/evidence/upload">
              <FileSearch className="mr-2 h-5 w-5" />
              Upload Evidence
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/reports/new">Start a Report</Link>
          </Button>
        </div>
      </OrnatePanel>

      <section className="mt-8 grid gap-5 md:grid-cols-3" aria-label="Evidence safeguards">
        <Card className="border-primary/35">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderLock className="h-5 w-5 text-accent" />
              Private Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Uploaded files are stored in a private bucket rather than exposed through public file URLs.
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/35">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-accent" />
              Controlled Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access is limited to the submitting account and authorized reviewers under platform policy.
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/35">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSearch className="h-5 w-5 text-accent" />
              Evidence-Led Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Documentation supports human review and does not automatically make an allegation public or verified.
            </p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}
