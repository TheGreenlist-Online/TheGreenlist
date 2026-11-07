'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Field, FormActions, Input } from '@/components/record/Field'
import { Notice } from '@/components/record/Notice'
import { Button } from '@/components/ui/button'
import { COA_MAX_BYTES } from '@/lib/coa/intake'

export function CoaIntakeForm() {
  const router = useRouter()
  const reference = useRef<string | null>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const pdf = form.get('pdf')
    if (!(pdf instanceof File) || !pdf.size || pdf.size > COA_MAX_BYTES) {
      setError('Choose one original PDF up to 3 MB.')
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    reference.current ??= crypto.randomUUID()
    form.set('id', reference.current)
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/coa', { method: 'POST', body: form })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Submission could not be confirmed. Check your submissions before retrying.')
      router.push(`/coa/submissions/${result.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Connection interrupted. Check your submissions before retrying.')
      requestAnimationFrame(() => errorRef.current?.focus())
      setBusy(false)
    }
  }

  return (
    <form className="gl-panel gl-panel__body" onSubmit={submit} aria-busy={busy}>
      <h2 className="greenlist-card-title">Submit an original COA</h2>
      <p className="my-4 text-sm">No allegation, report category, or existing business record is needed. Optional details below are your descriptions, not verified product or batch matches.</p>
      <fieldset disabled={busy}>
        <Field label="Original laboratory PDF" htmlFor="coa-pdf" required>
          <Input id="coa-pdf" name="pdf" type="file" accept="application/pdf,.pdf" required aria-describedby="coa-pdf-help" onChange={() => { reference.current = null }} />
          <p id="coa-pdf-help" className="gl-help">One PDF, up to 3 MB. Download it using the source page’s “View COA” link. Screenshots and product-page summaries are not the original certificate.</p>
        </Field>
        <Field label="Product name (optional)" htmlFor="coa-product">
          <Input id="coa-product" name="product" maxLength={160} autoComplete="off" />
        </Field>
        <Field label="Batch or package identifier (optional)" htmlFor="coa-batch">
          <Input id="coa-batch" name="batch" maxLength={160} autoComplete="off" aria-describedby="coa-batch-help" />
          <p id="coa-batch-help" className="gl-help">Copy the text exactly, including leading zeroes. Leave blank if unknown.</p>
        </Field>
        <Notice tone="info" className="my-5">
          The original PDF is retained unchanged, including any personal information or embedded metadata it contains. Only submit a document you have permission to share privately with The Green List. Do not include receipts, passwords, addresses, or unrelated personal information. This step does not authorize publication or AI processing.
        </Notice>
        <label className="flex items-start gap-3 text-sm" htmlFor="coa-consent">
          <input className="mt-1" id="coa-consent" name="consent" type="checkbox" value="yes" required />
          <span>I have permission to submit this PDF and understand it will be retained privately with my account for future human review.</span>
        </label>
        <FormActions><Button type="submit" disabled={busy}>{busy ? 'Uploading PDF…' : 'Submit PDF privately'}</Button></FormActions>
      </fieldset>
      <p role="status" className="gl-help">{busy ? 'Uploading. Keep this page open until your receipt appears.' : ''}</p>
      {error ? <p ref={errorRef} tabIndex={-1} role="alert" className="gl-limitations mt-4">{error} <a className="gl-link" href="/coa/submit">Check my submissions</a></p> : null}
    </form>
  )
}
