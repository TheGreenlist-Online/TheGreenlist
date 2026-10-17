'use client'

import { FormEvent, useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Field, FormActions, Notice, Select, Textarea } from '@/components/record'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDraftAutosave } from '@/hooks/useDraftAutosave'

const BUSINESS_TYPES = [
  { value: 'dispensary', label: 'Dispensary' },
  { value: 'cultivator', label: 'Cultivator' },
  { value: 'lab', label: 'Testing Lab' },
  { value: 'brand', label: 'Brand' },
  { value: 'delivery', label: 'Delivery Service' },
]

export function ClaimBusinessForm() {
  const [name, setName] = useState('')
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0].value)
  const [description, setDescription] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ slug: string } | null>(null)
  const [restoredAt, setRestoredAt] = useState<Date | null>(null)
  const [showRestoredBanner, setShowRestoredBanner] = useState(false)

  type ClaimDraft = {
    name: string
    businessType: string
    description: string
    websiteUrl: string
    state: string
    city: string
  }

  const { savedAt, isSaving, clearDraft, loadDraft } = useDraftAutosave<ClaimDraft>('business_claim', {
    name,
    businessType,
    description,
    websiteUrl,
    state,
    city,
  })

  useEffect(() => {
    let mounted = true
    loadDraft().then((draft) => {
      if (!mounted || !draft) return
      if (draft.name) setName(draft.name)
      if (draft.businessType) setBusinessType(draft.businessType)
      if (draft.description) setDescription(draft.description)
      if (draft.websiteUrl) setWebsiteUrl(draft.websiteUrl)
      if (draft.state) setState(draft.state)
      if (draft.city) setCity(draft.city)
      setRestoredAt(new Date())
      setShowRestoredBanner(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess(null)

    if (name.trim().length < 2) {
      setError('Business name is required.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          business_type: businessType,
          description: description.trim() || undefined,
          website_url: websiteUrl.trim() || undefined,
          state: state.trim() || undefined,
          city: city.trim() || undefined,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || 'The business profile could not be created.')
      }

      setSuccess({ slug: payload.slug })
      setName('')
      setDescription('')
      setWebsiteUrl('')
      setState('')
      setCity('')
      await clearDraft()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The business profile could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="gl-panel" onSubmit={handleSubmit}>
      <div className="gl-panel__head">
        <h2>Business record details</h2>
        <span className="gl-meta">
          {isSaving ? <span>Saving draft…</span> : savedAt ? <span>Draft saved {formatDistanceToNow(savedAt, { addSuffix: true })}</span> : <span>Draft autosaves</span>}
        </span>
      </div>
      <div className="gl-panel__body">
        <Notice tone="info" className="mb-5">
          Enter details exactly as they appear on the licence. The record is labelled <strong>Business-reported</strong> until licence and registration details are matched to an official source.
        </Notice>

        {showRestoredBanner && restoredAt ? (
          <Notice tone="info" className="mb-5">
            <span className="flex items-start justify-between gap-3">
              <span>Unsaved draft restored from {formatDistanceToNow(restoredAt, { addSuffix: true })}.</span>
              <button type="button" onClick={() => setShowRestoredBanner(false)} className="gl-link shrink-0 text-xs" aria-label="Dismiss">
                Dismiss
              </button>
            </span>
          </Notice>
        ) : null}

        <Field label="Legal or trading name" htmlFor="business-name" required help="As it appears on the licence. 2–160 characters.">
          <Input id="business-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={160} />
        </Field>

        <Field label="Business type" htmlFor="business-type">
          <Select id="business-type" value={businessType} onChange={(event) => setBusinessType(event.target.value)}>
            {BUSINESS_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Description" htmlFor="business-description" help="What the business does and its operating history. Factual; promotional copy is edited out. Up to 2,000 characters.">
          <Textarea id="business-description" className="min-h-32" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} />
        </Field>

        <Field label="Website" htmlFor="business-website">
          <Input id="business-website" type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://" />
        </Field>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="State" htmlFor="business-state" help="Two-letter code">
            <Input id="business-state" value={state} onChange={(event) => setState(event.target.value)} maxLength={64} />
          </Field>
          <Field label="City" htmlFor="business-city">
            <Input id="business-city" value={city} onChange={(event) => setCity(event.target.value)} maxLength={120} />
          </Field>
        </div>

        {error ? (
          <Notice tone="alert" className="mt-5">
            {error}
          </Notice>
        ) : null}

        {success ? (
          <Notice tone="confirmed" className="mt-5" role="status">
            <strong>Record created and labelled Business-reported.</strong>{' '}
            <a className="gl-link" href={`/businesses/${success.slug}`}>
              Open the record
            </a>
          </Notice>
        ) : null}

        <FormActions>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit record'}
          </Button>
          <span className="text-xs text-[var(--gl-text-muted)]">Reviewed against official sources before any status change.</span>
        </FormActions>
      </div>
    </form>
  )
}
