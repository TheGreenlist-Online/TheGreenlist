'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Field, FormActions, Notice, Select, Textarea } from '@/components/record'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDraftAutosave } from '@/hooks/useDraftAutosave'
import { REPORT_TYPES } from '@/lib/report-types'

type BusinessOption = { id: string; name: string }

export function ReportForm({ businesses }: { businesses: BusinessOption[] }) {
  const router = useRouter()
  const [reportType, setReportType] = useState('mislabeling')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationState, setLocationState] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [relatedBusiness, setRelatedBusiness] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [restoredAt, setRestoredAt] = useState<Date | null>(null)
  const [showRestoredBanner, setShowRestoredBanner] = useState(false)

  type ReportDraft = {
    reportType: string
    title: string
    description: string
    locationState: string
    locationCity: string
    isAnonymous: boolean
    relatedBusiness: string
    businessId: string
  }

  const { savedAt, isSaving, clearDraft, loadDraft } = useDraftAutosave<ReportDraft>('report', {
    reportType,
    title,
    description,
    locationState,
    locationCity,
    isAnonymous,
    relatedBusiness,
    businessId,
  })

  useEffect(() => {
    let mounted = true
    loadDraft().then((draft) => {
      if (!mounted || !draft) return
      if (draft.reportType) setReportType(draft.reportType)
      if (draft.title) setTitle(draft.title)
      if (draft.description) setDescription(draft.description)
      if (draft.locationState) setLocationState(draft.locationState)
      if (draft.locationCity) setLocationCity(draft.locationCity)
      if (draft.isAnonymous) setIsAnonymous(draft.isAnonymous)
      if (draft.relatedBusiness) setRelatedBusiness(draft.relatedBusiness)
      if (draft.businessId) setBusinessId(draft.businessId)
      setRestoredAt(new Date())
      setShowRestoredBanner(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (title.trim().length < 8 || title.trim().length > 160) {
      setError('Title must be between 8 and 160 characters.')
      return
    }

    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: reportType,
          title: title.trim(),
          description: description.trim(),
          location_state: locationState.trim() || null,
          location_city: locationCity.trim() || null,
          is_anonymous: isAnonymous,
          business_id: businessId || null,
          business_name_reported: businessId ? null : relatedBusiness.trim() || null,
        }),
      })

      const body = await response.json()

      if (!response.ok) {
        throw new Error(body?.error ?? 'The report could not be submitted.')
      }

      await clearDraft()
      router.push(`/reports/${body.id}`)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The report could not be submitted.')
      setIsSubmitting(false)
    }
  }

  return (
    <form className="gl-panel" onSubmit={handleSubmit}>
      <div className="gl-panel__head">
        <h2>Report</h2>
        <span className="gl-meta">
          {isSaving ? <span>Saving draft…</span> : savedAt ? <span>Draft saved {formatDistanceToNow(savedAt, { addSuffix: true })}</span> : <span>Draft autosaves</span>}
        </span>
      </div>
      <div className="gl-panel__body">
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

        <Field label="Report type" htmlFor="report-type">
          <Select id="report-type" value={reportType} onChange={(event) => setReportType(event.target.value)}>
            {REPORT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Title" htmlFor="report-title" required help="Identify the matter in one line. 8–160 characters.">
          <Input id="report-title" value={title} onChange={(event) => setTitle(event.target.value)} minLength={8} maxLength={160} required />
        </Field>

        <Field label="Account" htmlFor="report-description" required help="Facts, dates, location, and what you observed directly. Separate what you saw from what you were told.">
          <Textarea id="report-description" className="min-h-32" value={description} onChange={(event) => setDescription(event.target.value)} minLength={20} required />
        </Field>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="State" htmlFor="report-state" help="Two-letter code, e.g. CA">
            <Input id="report-state" value={locationState} onChange={(event) => setLocationState(event.target.value)} />
          </Field>
          <Field label="City" htmlFor="report-city">
            <Input id="report-city" value={locationCity} onChange={(event) => setLocationCity(event.target.value)} />
          </Field>
        </div>

        <Field label="Business concerned" htmlFor="report-business-select" help="Select a business on record, or enter its name if it is not yet listed. Optional.">
          <Select
            id="report-business-select"
            value={businessId}
            onChange={(event) => {
              setBusinessId(event.target.value)
              if (event.target.value) setRelatedBusiness('')
            }}
          >
            <option value="">Not on record / not applicable</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </Select>
          <Input
            id="report-business"
            className="mt-2"
            value={relatedBusiness}
            onChange={(event) => setRelatedBusiness(event.target.value)}
            disabled={Boolean(businessId)}
            maxLength={160}
            placeholder="Business name, if not listed above"
            aria-label="Business name, if not listed"
          />
        </Field>

        <label className="mt-3 flex items-start gap-3 text-sm text-[var(--gl-text-secondary)]">
          <input type="checkbox" className="mt-1" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
          <span>
            <span className="block font-medium text-[var(--gl-text)]">Request public anonymity</span>
            <span>Authorised reviewers can still identify the submitting account for safety and due process.</span>
          </span>
        </label>

        {error ? (
          <Notice tone="alert" className="mt-5">
            {error}
          </Notice>
        ) : null}

        <FormActions>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit report'}
          </Button>
          <span className="text-xs text-[var(--gl-text-muted)]">Private on receipt. Reviewed before any publication.</span>
        </FormActions>
      </div>
    </form>
  )
}
