'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const REPORT_TYPES = [
  { value: 'mislabeling', label: 'Mislabeling' },
  { value: 'contamination', label: 'Contamination' },
  { value: 'licensing', label: 'Licensing' },
  { value: 'worker_safety', label: 'Worker Safety' },
  { value: 'deceptive_marketing', label: 'Deceptive Marketing' },
  { value: 'other', label: 'Other' },
]

export function ReportForm() {
  const router = useRouter()
  const [reportType, setReportType] = useState('mislabeling')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationState, setLocationState] = useState('')
  const [locationCity, setLocationCity] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [relatedBusiness, setRelatedBusiness] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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
          // NOTE: related-business linkage is currently free text only. There is
          // no business picker wired up yet — see TODO in reports/new/page.tsx.
        }),
      })

      const body = await response.json()

      if (!response.ok) {
        throw new Error(body?.error ?? 'The report could not be submitted.')
      }

      router.push(`/reports/${body.id}`)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The report could not be submitted.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle>File a Report</CardTitle>
          <CardDescription>
            Document a mislabeling, contamination, licensing, worker-safety, deceptive-marketing, or other
            accountability concern. Reports are reviewed before any public action is taken.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm font-medium" htmlFor="report-type">
              Report type
              <select
                id="report-type"
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium" htmlFor="report-title">
              Title
              <Input
                id="report-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                minLength={8}
                maxLength={160}
                required
                placeholder="Briefly identify the concern"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium" htmlFor="report-description">
              Description
              <textarea
                id="report-description"
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                minLength={20}
                required
                placeholder="Describe the facts, dates, location, and why this matters."
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium" htmlFor="report-state">
                State
                <Input
                  id="report-state"
                  value={locationState}
                  onChange={(event) => setLocationState(event.target.value)}
                  placeholder="e.g. CA"
                />
              </label>
              <label className="block space-y-2 text-sm font-medium" htmlFor="report-city">
                City
                <Input
                  id="report-city"
                  value={locationCity}
                  onChange={(event) => setLocationCity(event.target.value)}
                  placeholder="e.g. Oakland"
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium" htmlFor="report-business">
              Related business <span className="font-normal text-muted-foreground">(optional, free text for now)</span>
              <Input
                id="report-business"
                value={relatedBusiness}
                onChange={(event) => setRelatedBusiness(event.target.value)}
                placeholder="Business name, if applicable"
              />
              <span className="block text-xs font-normal text-muted-foreground">
                A business directory picker is not yet available. This field is not saved to a business
                record — mention the business name in the description above for now.
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={isAnonymous}
                onChange={(event) => setIsAnonymous(event.target.checked)}
              />
              <span>
                <span className="block font-medium">Request public anonymity</span>
                <span className="text-muted-foreground">
                  Authorized reviewers can still identify the submitting account for safety and due process.
                </span>
              </span>
            </label>

            {error ? (
              <p role="alert" className="rounded-lg border border-red-400/40 bg-red-950/35 p-3 text-sm text-red-100">
                {error}
              </p>
            ) : null}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit Report'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
