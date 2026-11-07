import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiAuditEntry } from '@/lib/ai/audit'

const { createClient, insert, from } = vi.hoisted(() => ({
  createClient: vi.fn(), insert: vi.fn(), from: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('@supabase/supabase-js', () => ({ createClient }))

const entry: AiAuditEntry = {
  userId: null,
  feature: 'records-guide',
  model: 'test-model',
  requestId: 'test-request',
  inputClassification: 'public_query',
  recordsAccessed: [{ recordType: 'report', recordId: 'record-id' }],
  toolNames: ['getPublicReport'],
  outputClassification: 'public_navigation',
  humanReviewRequired: false,
  moderationRecommendation: null,
  moderationConfidence: null,
  latencyMs: 1.5,
  tokenUsage: { input: 1, output: 2, total: 3 },
  estimatedCostUsd: null,
  status: 'success',
  errorCode: null,
}

beforeEach(() => {
  vi.resetModules()
  vi.resetAllMocks()
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
  vi.stubEnv('SUPABASE_SECRET_KEY', 'test-only-secret')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  createClient.mockReturnValue({ from })
  from.mockReturnValue({ insert })
  insert.mockResolvedValue({ error: null })
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('recordAiAudit', () => {
  it('writes only expected metadata and returns true', async () => {
    const { recordAiAudit } = await import('@/lib/ai/audit')
    await expect(recordAiAudit(entry)).resolves.toBe(true)
    expect(from).toHaveBeenCalledWith('ai_audit_logs')
    expect(insert).toHaveBeenCalledWith({
      user_id: null, feature: 'records-guide', model: 'test-model', request_id: 'test-request',
      input_classification: 'public_query', records_accessed: [{ record_type: 'report', record_id: 'record-id' }],
      tool_names: ['getPublicReport'], output_classification: 'public_navigation', human_review_required: false,
      moderation_recommendation: null, moderation_confidence: null, latency_ms: 2,
      token_usage: { input: 1, output: 2, total: 3 }, estimated_cost_usd: null, status: 'success', error_code: null,
    })
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('returns false without constructing a client when credentials are missing', async () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', '')
    const { recordAiAudit } = await import('@/lib/ai/audit')
    await expect(recordAiAudit(entry)).resolves.toBe(false)
    expect(createClient).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledOnce()
  })

  it.each(['construction', 'query', 'rejection', 'returned error'])(
    'contains %s failures without logging upstream details', async (failure) => {
      const unsafeMessage = 'test-only-secret private draft sb_secret_fixture postgres://private-host'
      if (failure === 'construction') createClient.mockImplementation(() => { throw new Error(unsafeMessage) })
      if (failure === 'query') from.mockImplementation(() => { throw new Error(unsafeMessage) })
      if (failure === 'rejection') insert.mockRejectedValue(new Error(unsafeMessage))
      if (failure === 'returned error') insert.mockResolvedValue({ error: { message: unsafeMessage } })
      const { recordAiAudit } = await import('@/lib/ai/audit')
      await expect(recordAiAudit(entry)).resolves.toBe(false)
      expect(console.warn).toHaveBeenCalledOnce()
      const logs = JSON.stringify(vi.mocked(console.warn).mock.calls)
      expect(logs).toContain('feature=records-guide request=test-request')
      expect(logs).not.toContain(unsafeMessage)
      expect(logs).not.toContain('test-only-secret')
      expect(logs).not.toContain('private draft')
      expect(logs).not.toContain('sb_secret_fixture')
    },
  )
})
