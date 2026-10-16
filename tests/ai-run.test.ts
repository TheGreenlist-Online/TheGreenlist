import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import type { AiPrincipal } from '@/lib/ai/permissions'
import { getTownDestination } from '@/lib/ai/tools/platform'
import { runAiFeature } from '@/lib/ai/run'
import { townGuideOutputSchema } from '@/lib/ai/schemas'

const { mockCreate, mockGetAiConfig, mockRequireOpenAIClient } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockGetAiConfig: vi.fn(),
  mockRequireOpenAIClient: vi.fn(),
}))

vi.mock('@/lib/ai/client', () => ({ requireOpenAIClient: mockRequireOpenAIClient }))
vi.mock('@/lib/ai/config', () => ({ getAiConfig: mockGetAiConfig }))

const principal = {
  supabase: {},
  user: null,
  role: null,
  isPlatformOwner: false,
  tier: 'free_resident',
  dailyAllowance: 10,
  isAuthenticated: false,
} as unknown as AiPrincipal

beforeEach(() => {
  vi.clearAllMocks()
  mockGetAiConfig.mockReturnValue({
    model: 'gpt-4o-mini',
    maxInputCharacters: 8_000,
    maxOutputTokens: 1_200,
  })
  mockRequireOpenAIClient.mockReturnValue({ responses: { create: mockCreate } })
})

describe('runAiFeature', () => {
  it('rejects inputs above the configured character limit before calling OpenAI', async () => {
    mockGetAiConfig.mockReturnValue({
      model: 'gpt-4o-mini',
      maxInputCharacters: 100,
      maxOutputTokens: 1_200,
    })

    await expect(
      runAiFeature({
        feature: 'report-assistant',
        principal,
        input: [{ role: 'user', content: 'x'.repeat(200) }],
        outputSchema: z.object({ result: z.string() }),
        outputSchemaName: 'test_output',
      }),
    ).rejects.toMatchObject({ code: 'payload_too_large' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('rejects unsafe model-generated Town Guide links', async () => {
    mockCreate.mockResolvedValue({
      output_text: JSON.stringify({
        message: 'Go here',
        destinations: [{ title: 'External', standardHref: '//example.com', townHref: null, reason: 'Go' }],
        sources: [],
        safetyNotice: null,
      }),
      output: [],
    })

    await expect(
      runAiFeature({
        feature: 'town-guide',
        principal,
        input: [{ role: 'user', content: 'Where should I go?' }],
        outputSchema: townGuideOutputSchema,
        outputSchemaName: 'town_guide_answer',
      }),
    ).rejects.toMatchObject({ code: 'invalid_model_output' })
  })

  it('wraps tool results as untrusted content before sending them back to the model', async () => {
    mockCreate
      .mockResolvedValueOnce({
        output: [
          {
            type: 'function_call',
            call_id: 'call-1',
            name: 'getTownDestination',
            arguments: '{"topic":"forums"}',
          },
        ],
      })
      .mockResolvedValueOnce({
        output_text: JSON.stringify({
          message: 'The Forum Hall is available.',
          destinations: [],
          sources: [],
          safetyNotice: null,
        }),
        output: [],
      })

    const result = await runAiFeature({
      feature: 'town-guide',
      principal,
      input: [{ role: 'user', content: 'Where are the forums?' }],
      outputSchema: townGuideOutputSchema,
      outputSchemaName: 'town_guide_answer',
      tools: [getTownDestination],
    })

    expect(result.output.message).toBe('The Forum Hall is available.')
    const secondInput = mockCreate.mock.calls[1][0].input as Array<{ type?: string; output?: string }>
    const toolOutput = secondInput.find((item) => item.type === 'function_call_output')?.output
    expect(toolOutput).toContain('<untrusted-content source="tool getTownDestination result">')
    expect(toolOutput).toContain('</untrusted-content>')
  })
})
