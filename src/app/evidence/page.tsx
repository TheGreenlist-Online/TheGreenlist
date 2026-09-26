import Link from 'next/link'
import { FileSearch, FolderLock, ShieldCheck } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Evidence Center - The Green List',
  description: 'Private-by-default document intake supporting accountability reports and correction requests.',
}

export default function EvidencePage() {
  return (
    <PageShell>
      <OrnatePanel>
        <p className="greenlist-eyebrow">Evidence</p>
        <h1 className="greenlist-page-title">Evidence intake</h1>
        <p className="greenlist-page-lede">
          Attach photographs, receipts, labels, screenshots, PDFs, and written records to a report or a correction
          request. Submissions are private on receipt and remain private while authorised reviewers assess them.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/evidence/upload">
              <FileSearch className="mr-2 h-5 w-5" />
              Submit evidence
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/reports/new">File a report</Link>
          </Button>
        </div>
      </OrnatePanel>

      <section className="mt-8 grid gap-5 md:grid-cols-3" aria-label="Evidence safeguards">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderLock className="h-5 w-5 text-accent" />
              Private storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Uploaded files are stored in a private bucket rather than exposed through public file URLs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-accent" />
              Controlled access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access is limited to the submitting account and authorized reviewers under platform policy.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSearch className="h-5 w-5 text-accent" />
              Review before publication
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
