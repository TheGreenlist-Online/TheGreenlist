'use client'

import { FormEvent, useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="mx-auto max-w-2xl">
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle>Business Profile Details</CardTitle>
          <CardDescription>
            Provide accurate details. Your profile begins as unverified until reviewed by our team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showRestoredBanner && restoredAt ? (
            <div className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-accent-foreground">
              <span>Restored your unsaved draft from {formatDistanceToNow(restoredAt, { addSuffix: true })}.</span>
              <button
                type="button"
                onClick={() => setShowRestoredBanner(false)}
                className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                Dismiss
              </button>
            </div>
          ) : null}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm font-medium" htmlFor="business-name">
              Business name
              <Input
                id="business-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                maxLength={160}
                placeholder="e.g. Evergreen Dispensary"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium" htmlFor="business-type">
              Business type
              <select
                id="business-type"
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value)}
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium" htmlFor="business-description">
              Description
              <textarea
                id="business-description"
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={2000}
                placeholder="Describe what the business does and its operating history."
              />
            </label>

            <label className="block space-y-2 text-sm font-medium" htmlFor="business-website">
              Website URL
              <Input
                id="business-website"
                type="url"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="https://example.com"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium" htmlFor="business-state">
                State
                <Input
                  id="business-state"
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  placeholder="e.g. CA"
                  maxLength={64}
                />
              </label>
              <label className="block space-y-2 text-sm font-medium" htmlFor="business-city">
                City
                <Input
                  id="business-city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="e.g. Los Angeles"
                  maxLength={120}
                />
              </label>
            </div>

            {error ? (
              <p role="alert" className="rounded-lg border border-red-400/40 bg-red-950/35 p-3 text-sm text-red-100">
                {error}
              </p>
            ) : null}

            {success ? (
              <div role="status" className="rounded-lg border border-emerald-400/40 bg-emerald-950/35 p-4 text-sm text-emerald-100">
                <p className="font-semibold">Business profile created and marked unverified.</p>
                <a className="mt-2 inline-block font-semibold text-accent hover:underline" href={`/businesses/${success.slug}`}>
                  View your business profile
                </a>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {isSaving ? 'Saving…' : savedAt ? `Draft saved ${formatDistanceToNow(savedAt, { addSuffix: true })}` : ''}
              </span>
            </div>

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Business Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
