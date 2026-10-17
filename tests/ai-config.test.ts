import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getAiConfig, isAiFeature } from '@/lib/ai/config'

const MANAGED_KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_AI_FEATURES_ENABLED',
  'OPENAI_MODEL',
  'OPENAI_MODERATION_MODEL',
  'OPENAI_REQUEST_TIMEOUT_MS',
  'OPENAI_MAX_INPUT_CHARACTERS',
  'OPENAI_MAX_OUTPUT_TOKENS',
]

let saved: Record<string, string | undefined> = {}

beforeEach(() => {
  saved = {}
  for (const key of MANAGED_KEYS) {
    saved[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of MANAGED_KEYS) {
    if (saved[key] === undefined) delete process.env[key]
    else process.env[key] = saved[key]
  }
})

describe('getAiConfig', () => {
  it('reports AI as unavailable without an API key, and never throws', () => {
    const config = getAiConfig()
    expect(config.enabled).toBe(false)
    expect(config.disabledReason).toBe('AI features are not configured for this deployment.')
  })

  it('enables AI once a key is present', () => {
    process.env.OPENAI_API_KEY = 'sk-test-key'
    const config = getAiConfig()
    expect(config.enabled).toBe(true)
    expect(config.disabledReason).toBeNull()
  })

  it('honours the kill switch even when a key is present', () => {
    process.env.OPENAI_API_KEY = 'sk-test-key'
    process.env.OPENAI_AI_FEATURES_ENABLED = 'false'
    const config = getAiConfig()
    expect(config.enabled).toBe(false)
    expect(config.disabledReason).toBe('AI features are turned off for this deployment.')
  })

  it('treats whitespace-only keys as absent', () => {
    process.env.OPENAI_API_KEY = '   '
    expect(getAiConfig().enabled).toBe(false)
  })

  it('never exposes the API key on the config object', () => {
    process.env.OPENAI_API_KEY = 'sk-super-secret'
    expect(JSON.stringify(getAiConfig())).not.toContain('sk-super-secret')
  })

  it('falls back to documented model defaults', () => {
    const config = getAiConfig()
    expect(config.model).toBe('gpt-4o-mini')
    expect(config.moderationModel).toBe('omni-moderation-latest')
    expect(config.requestTimeoutMs).toBe(30_000)
    expect(config.maxInputCharacters).toBe(8_000)
    expect(config.maxOutputTokens).toBe(1_200)
  })

  it('clamps out-of-range tuning values instead of trusting them', () => {
    process.env.OPENAI_REQUEST_TIMEOUT_MS = '1'
    process.env.OPENAI_MAX_INPUT_CHARACTERS = '9999999'
    process.env.OPENAI_MAX_OUTPUT_TOKENS = '-5'

    const config = getAiConfig()
    expect(config.requestTimeoutMs).toBe(5_000)
    expect(config.maxInputCharacters).toBe(40_000)
    expect(config.maxOutputTokens).toBe(256)
  })

  it('ignores unparseable tuning values', () => {
    process.env.OPENAI_MAX_OUTPUT_TOKENS = 'not-a-number'
    expect(getAiConfig().maxOutputTokens).toBe(1_200)
  })

  it('returns a frozen object so callers cannot mutate shared config', () => {
    expect(Object.isFrozen(getAiConfig())).toBe(true)
  })
})

describe('isAiFeature', () => {
  it('accepts known features and rejects everything else', () => {
    expect(isAiFeature('town-guide')).toBe(true)
    expect(isAiFeature('moderation-review')).toBe(true)
    expect(isAiFeature('delete-everything')).toBe(false)
    expect(isAiFeature(null)).toBe(false)
    expect(isAiFeature(42)).toBe(false)
  })
})
