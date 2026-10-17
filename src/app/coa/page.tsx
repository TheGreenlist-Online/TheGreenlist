import Link from 'next/link'
import { PageShell } from '@/components/PageShell'

export const metadata = {
  title: 'COA intake | The Green List',
  description: 'Learn how certificates of analysis will be submitted for private review.',
}

export default function CoaPage() {
  return (
    <PageShell>
      <section
        aria-labelledby="coa-title"
        className="relative isolate overflow-hidden rounded-2xl border border-emerald-700/40 bg-[#071c18] shadow-lg"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover bg-[65%_center] opacity-75"
          style={{
            backgroundImage: "linear-gradient(90deg,rgba(3,16,17,.98) 0%,rgba(3,16,17,.95) 38%,rgba(3,16,17,.72) 63%,rgba(3,16,17,.30) 100%),url('/images/coa-qr-scan-hero.png')",
          }}
        />
        <div className="relative z-10 px-5 py-9 sm:px-9 sm:py-12">
          <p className="text-sm font-bold uppercase tracking-[.15em] text-emerald-400">COA intake</p>
          <h1 id="coa-title" className="mt-3 max-w-4xl text-3xl font-bold leading-tight text-white sm:text-5xl">
            Upload a Certificate of Analysis
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100">
            Help make cannabis laboratory results easier to understand and trace to the product batch.
            Documents will require private review before any verified information is published.
          </p>
          <div className="mt-7 max-w-2xl rounded-2xl border-2 border-emerald-400/80 bg-[#081a1b]/95 p-6 text-center shadow-[0_0_28px_rgba(52,211,153,.12)] sm:p-9">
            <svg aria-hidden="true" className="mx-auto h-12 w-12 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4m0 0L8 8m4-4 4 4" />
              <path d="M20 16.6a5 5 0 0 0-2.5-9.1A6.5 6.5 0 0 0 5 9.2 4.5 4.5 0 0 0 6.5 18H8" />
              <path d="M12 20v-9" />
            </svg>
            <h2 className="mt-3 text-2xl font-bold text-white">Upload COA</h2>
            <p className="mt-2 text-sm text-slate-200">PDF or clear photographs of a laboratory certificate.</p>
            <p className="mt-2 text-sm font-semibold text-amber-200" role="status">Submissions are not open yet. Private intake is being validated.</p>
            <button type="button" disabled aria-disabled="true" className="mt-5 w-full cursor-not-allowed rounded-lg bg-emerald-400/60 px-6 py-3 font-bold text-[#071c18] opacity-80 sm:w-80">
              Choose file · Coming soon
            </button>
            <p className="mt-3 text-xs text-slate-300">No file is selected or sent from this page.</p>
          </div>
          <div className="mt-6 grid max-w-3xl gap-4 text-sm text-slate-100 sm:grid-cols-3">
            <p><strong className="block text-emerald-300">Private by default</strong>Documents are not automatically public.</p>
            <p><strong className="block text-emerald-300">Human review</strong>Extraction is not verification.</p>
            <p><strong className="block text-emerald-300">Batch-linked records</strong>Results will identify the tested product batch.</p>
          </div>
        </div>
      </section>
      <p className="mt-6 text-sm text-[var(--gl-text-secondary)]">
        Need to submit evidence for an existing report instead? <Link href="/evidence/upload" className="gl-link">Open the existing evidence workflow</Link>.
        A COA alone should not require an allegation.
      </p>
    </PageShell>
  )
}
