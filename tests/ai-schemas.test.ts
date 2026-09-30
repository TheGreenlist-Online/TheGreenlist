import { describe, expect, it } from 'vitest'
import {
  businessTransparencyOutputSchema,
  forumSummaryOutputSchema,
  moderationReviewOutputSchema,
  reportAssistantOutputSchema,
  reportAssistantRequestSchema,
  toResponseJsonSchema,
  townGuideOutputSchema,
  townGuideRequestSchema,
} from '@/lib/ai/schemas'

describe('townGuideRequestSchema', () => {
  it('rejects a question that is too short to act on', () => {
    expect(townGuideRequestSchema.safeParse({ message: 'hi' }).success).toBe(false)
  })

  it('rejects a message beyond the length cap', () => {
    expect(townGuideRequestSchema.safeParse({ message: 'a'.repeat(2_001) }).success).toBe(false)
  })

  it('caps conversation history so the request cannot grow unbounded', () => {
    const turn = { role: 'user' as const, content: 'hello' }
    expect(
      townGuideRequestSchema.safeParse({ message: 'Where do I report?', history: Array(7).fill(turn) }).success,
    ).toBe(false)
  })

  it('accepts a well-formed request', () => {
    const parsed = townGuideRequestSchema.safeParse({
      message: '  How do I file a report?  ',
      currentPath: '/town',
      history: [{ role: 'user', content: 'hello' }],
    })
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.message).toBe('How do I file a report?')
  })
})

describe('reportAssistantRequestSchema', () => {
  const draft = 'On 3 June the shop refused to show me a licence when I asked at the counter.'

  it('refuses to process a draft without explicit consent', () => {
    expect(reportAssistantRequestSchema.safeParse({ draft }).success).toBe(false)
    expect(reportAssistantRequestSchema.safeParse({ draft, consentToProcess: false }).success).toBe(false)
  })

  it('accepts a draft once consent is given', () => {
    expect(reportAssistantRequestSchema.safeParse({ draft, consentToProcess: true }).success).toBe(true)
  })

  it('has no field that could point at another user\'s report', () => {
    const keys = Object.keys(reportAssistantRequestSchema.shape)
    expect(keys).toEqual(['draft', 'category', 'consentToProcess'])
  })
})

describe('moderationReviewOutputSchema', () => {
  const valid = {
    recommendation: 'HOLD_FOR_REVIEW',
    confidence: 'medium',
    reasons: ['Unsubstantiated medical claim.'],
    policyReferences: [],
    riskFactors: [],
    requiresHumanReview: true,
    safetyNotice: null,
  }

  it('accepts a well-formed recommendation', () => {
    expect(moderationReviewOutputSchema.safeParse(valid).success).toBe(true)
  })

  it('cannot express a recommendation that bypasses human review', () => {
    expect(moderationReviewOutputSchema.safeParse({ ...valid, requiresHumanReview: false }).success).toBe(false)
  })

  it('requires at least one stated reason', () => {
    expect(moderationReviewOutputSchema.safeParse({ ...valid, reasons: [] }).success).toBe(false)
  })

  it('rejects recommendations outside the allowed set, including punitive ones', () => {
    for (const recommendation of ['BAN_USER', 'DELETE_ACCOUNT', 'PUBLISH', '']) {
      expect(moderationReviewOutputSchema.safeParse({ ...valid, recommendation }).success).toBe(false)
    }
  })
})

describe('businessTransparencyOutputSchema', () => {
  it('has no field capable of carrying a score, grade or rating', () => {
    const keys = Object.keys(businessTransparencyOutputSchema.shape).join(' ').toLowerCase()
    for (const banned of ['score', 'grade', 'rating', 'rank']) {
      expect(keys).not.toContain(banned)
    }
  })
})

describe('toResponseJsonSchema', () => {
  const schemas = [
    ['town-guide', townGuideOutputSchema],
    ['forum-summary', forumSummaryOutputSchema],
    ['report-assistant', reportAssistantOutputSchema],
    ['moderation-review', moderationReviewOutputSchema],
    ['business-transparency', businessTransparencyOutputSchema],
  ] as const

  it.each(schemas)('%s converts to a strict-mode-compatible JSON schema', (_name, schema) => {
    const json = toResponseJsonSchema(schema) as {
      $schema?: unknown
      type: string
      properties: Record<string, unknown>
      required: string[]
      additionalProperties: boolean
    }

    // OpenAI rejects the $schema annotation outright.
    expect(json.$schema).toBeUndefined()
    expect(json.type).toBe('object')
    expect(json.additionalProperties).toBe(false)
    // Strict mode requires every property to be listed as required.
    expect(json.required.slice().sort()).toEqual(Object.keys(json.properties).sort())
  })

  it('models optional output as nullable rather than absent', () => {
    const json = toResponseJsonSchema(townGuideOutputSchema) as {
      required: string[]
      properties: Record<string, { type?: unknown; anyOf?: unknown }>
    }
    expect(json.required).toContain('safetyNotice')
    expect(JSON.stringify(json.properties.safetyNotice)).toContain('null')
  })
})
