import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RecordsGuideAnswer } from '@/components/ai/RecordsGuide'
import type { RecordsGuideOutput } from '@/lib/ai/schemas'

const answer: RecordsGuideOutput = {
  message: 'Read the source record before relying on a summary.',
  destinations: [],
  sources: [],
  safetyNotice: null,
}

describe('Records Guide answer', () => {
  it('renders a returned safety notice alongside the answer using the shared notice', () => {
    const html = renderToStaticMarkup(createElement(RecordsGuideAnswer, {
      answer: { ...answer, safetyNotice: 'This allegation is unverified. This is not legal advice.' },
    }))
    expect(html).toContain(answer.message)
    expect(html).toContain('Safety notice')
    expect(html).toContain('This allegation is unverified. This is not legal advice.')
    expect(html).toContain('gl-notice--review')
    expect(html).toContain('role="note"')
  })

  it('omits the notice when the next answer has no safety notice', () => {
    const html = renderToStaticMarkup(createElement(RecordsGuideAnswer, { answer }))
    expect(html).toContain(answer.message)
    expect(html).not.toContain('Safety notice')
    expect(html).not.toContain('gl-notice')
  })

  it('renders model-supplied notice markup as text', () => {
    const html = renderToStaticMarkup(createElement(RecordsGuideAnswer, {
      answer: { ...answer, safetyNotice: '<script>alert("unsafe")</script>' },
    }))
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })
})
