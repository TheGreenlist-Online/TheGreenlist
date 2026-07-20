'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, FlaskConical, Scale, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const categories = [
  { value: 'SAFETY_GUIDE', title: 'Safety Guide', description: 'Testing standards, contamination prevention, consumer protection, labeling, and responsible-use information.', icon: ShieldCheck },
  { value: 'REGULATORY_RESOURCE', title: 'Regulatory Resource', description: 'Licensing rules, compliance requirements, agency guidance, policy changes, and legal frameworks.', icon: Scale },
  { value: 'WORKER_RIGHTS', title: 'Worker Rights', description: 'Workplace safety, wage protections, labor rights, fair practices, reporting channels, and industry standards.', icon: Users },
  { value: 'RESEARCH_SUMMARY', title: 'Research Summary', description: 'Plain-language summaries of studies, datasets, testing findings, public-health evidence, and accountability research.', icon: FlaskConical },
]

export default function EducationNewPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [userId, setUserId] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [category, setCategory] = useState('SAFETY_GUIDE')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [sources, setSources] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUserId(data.session?.user.id ?? null)
      setCheckingSession(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserId(session?.user.id ?? null)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!userId) {
      setError('Please sign in before submitting educational content.')
      return
    }

    setSubmitting(true)
    const sourceUrls = sources.split('\n').map((item) => item.trim()).filter(Boolean)
    const { error: insertError } = await supabase.from('education_resources').insert({
      submitter_id: userId,
      category,
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      source_urls: sourceUrls,
      status: 'PENDING_REVIEW',
    })
    setSubmitting(false)

    if (insertError) {
      setError(insertError.message || 'Your submission could not be saved.')
      return
    }

    setTitle('')
    setSummary('')
    setContent('')
    setSources('')
    setMessage('Submission received. It is now marked Pending Review and will not be published until approved.')
  }

  return (
    <div className="min-h-screen smoke-surface flex flex-col platform-stage">
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 md:py-14">
        <section className="relative overflow-hidden rounded-3xl border border-amber-300/30 bg-[#07110c]/90 px-6 py-10 shadow-2xl shadow-black/40 md:px-12 md:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(147,51,234,.2),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(34,211,238,.15),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(132,204,22,.18),transparent_35%)]" />
          <div className="relative max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-lime-300">Education Center</p>
            <h1 className="mt-4 text-4xl font-bold leading-none text-amber-50 md:text-6xl">Share knowledge that strengthens the community.</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">Submit evidence-based guides, regulatory resources, worker-rights information, or research summaries. Every submission enters a transparent review queue before publication.</p>
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((item) => {
            const Icon = item.icon
            const active = category === item.value
            return (
              <button key={item.value} type="button" onClick={() => setCategory(item.value)} className={`text-left rounded-2xl border p-5 transition ${active ? 'border-lime-300/70 bg-lime-300/10 shadow-lg shadow-lime-950/30' : 'border-emerald-300/20 bg-[#08110d]/85 hover:border-emerald-300/45'}`}>
                <Icon className="h-7 w-7 text-lime-300" />
                <h2 className="mt-4 text-xl text-amber-50">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
              </button>
            )
          })}
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_.65fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-emerald-300/25 bg-[#07100c]/92 p-6 shadow-xl shadow-black/30 md:p-8">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-lime-300" />
              <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">Selected category</p><h2 className="text-2xl text-amber-50">{categories.find((item) => item.value === category)?.title}</h2></div>
            </div>

            {!checkingSession && !userId ? (
              <div className="mt-6 rounded-xl border border-amber-300/30 bg-amber-950/20 p-4 text-sm text-amber-100">You are not signed in. The form stays visible so you can review what is required, but submission requires authentication. <Link className="font-bold text-lime-300 underline" href="/auth/signin?callbackUrl=/education/new">Sign in here</Link>.</div>
            ) : null}

            <div className="mt-7 space-y-5">
              <label className="block text-sm font-semibold text-zinc-200">Title<Input className="mt-2" value={title} onChange={(event) => setTitle(event.target.value)} minLength={8} maxLength={160} required placeholder="A specific, factual title" /></label>
              <label className="block text-sm font-semibold text-zinc-200">Summary<textarea className="mt-2 min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={summary} onChange={(event) => setSummary(event.target.value)} minLength={20} maxLength={500} required placeholder="Explain what readers will learn and why it matters." /></label>
              <label className="block text-sm font-semibold text-zinc-200">Full resource<textarea className="mt-2 min-h-64 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={content} onChange={(event) => setContent(event.target.value)} minLength={100} maxLength={20000} required placeholder="Provide the complete educational content. Separate verified facts, interpretation, and personal experience." /></label>
              <label className="block text-sm font-semibold text-zinc-200">Source links <span className="font-normal text-zinc-500">(one per line)</span><textarea className="mt-2 min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={sources} onChange={(event) => setSources(event.target.value)} placeholder="https://agency.gov/resource\nhttps://journal.org/study" /></label>
            </div>

            {error ? <div className="mt-5 rounded-xl border border-red-400/35 bg-red-950/30 p-4 text-sm text-red-100">{error}</div> : null}
            {message ? <div className="mt-5 rounded-xl border border-emerald-300/35 bg-emerald-950/30 p-4 text-sm text-emerald-100">{message}</div> : null}

            <Button className="mt-6 w-full" size="lg" type="submit" disabled={submitting || checkingSession || !userId}>{submitting ? 'Submitting...' : userId ? 'Submit for review' : 'Sign in required'}</Button>
          </form>

          <aside className="rounded-3xl border border-amber-300/25 bg-[#0a120e]/88 p-6 md:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-300">Publication standards</p>
            <h2 className="mt-3 text-3xl text-amber-50">Useful. Verifiable. Non-commercial.</h2>
            <div className="mt-6 space-y-5 text-sm leading-6 text-zinc-300">
              <div><strong className="text-emerald-300">Evidence-led</strong><p>Use primary sources, public records, research, or clearly identified firsthand experience.</p></div>
              <div><strong className="text-emerald-300">Accessible</strong><p>Explain technical terms and provide practical context for a general audience.</p></div>
              <div><strong className="text-emerald-300">Impartial</strong><p>Do not use education submissions as advertising, product promotion, or a sales funnel.</p></div>
              <div><strong className="text-emerald-300">Current</strong><p>Include dates, jurisdictions, and source links when regulations or findings may change.</p></div>
              <div><strong className="text-emerald-300">Transparent review</strong><p>New submissions begin as Pending Review. Approval does not imply legal or medical endorsement.</p></div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}
