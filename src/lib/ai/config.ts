/**
 * AI environment validation and feature flags.
 *
 * Mirrors the build-time-tolerant pattern already used by
 * `src/lib/supabase/env.ts`: reading configuration must never throw during
 * `next build`, because the production build runs without secrets. Callers get
 * an explicit `enabled: false` instead and are expected to fail soft.
 */

export const AI_FEATURES = [
  'town-guide',
  'forum-summary',
  'report-assistant',
  'moderation-review',
  'business-transparency',
] as const

export type AiFeature = (typeof AI_FEATURES)[number]

export type AiConfig = Readonly<{
  enabled: boolean
  /** Why AI is unavailable, safe to surface to clients. Null when enabled. */
  disabledReason: string | null
  model: string
  moderationModel: string
  requestTimeoutMs: number
  maxInputCharacters: number
  maxOutputTokens: number
}>

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_MODERATION_MODEL = 'omni-moderation-latest'
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_INPUT_CHARACTERS = 8_000
const DEFAULT_MAX_OUTPUT_TOKENS = 1_200

function readEnv(name: string) {
  return process.env[name]?.trim() ?? ''
}

function readBooleanEnv(name: string, fallback: boolean) {
  const raw = readEnv(name).toLowerCase()
  if (!raw) return fallback
  return raw === 'true' || raw === '1' || raw === 'yes'
}

function readIntEnv(name: string, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(readEnv(name), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

/**
 * Resolve AI configuration from the environment.
 *
 * Never throws and never returns the API key itself — only whether one is
 * present. Read fresh on every call so that serverless instances pick up
 * configuration changes without a cold start.
 */
export function getAiConfig(): AiConfig {
  const hasApiKey = readEnv('OPENAI_API_KEY').length > 0
  const flagEnabled = readBooleanEnv('OPENAI_AI_FEATURES_ENABLED', true)

  let disabledReason: string | null = null
  if (!flagEnabled) {
    disabledReason = 'AI features are turned off for this deployment.'
  } else if (!hasApiKey) {
    disabledReason = 'AI features are not configured for this deployment.'
  }

  return Object.freeze({
    enabled: disabledReason === null,
    disabledReason,
    model: readEnv('OPENAI_MODEL') || DEFAULT_MODEL,
    moderationModel: readEnv('OPENAI_MODERATION_MODEL') || DEFAULT_MODERATION_MODEL,
    requestTimeoutMs: readIntEnv('OPENAI_REQUEST_TIMEOUT_MS', DEFAULT_TIMEOUT_MS, 5_000, 120_000),
    maxInputCharacters: readIntEnv('OPENAI_MAX_INPUT_CHARACTERS', DEFAULT_MAX_INPUT_CHARACTERS, 500, 40_000),
    maxOutputTokens: readIntEnv('OPENAI_MAX_OUTPUT_TOKENS', DEFAULT_MAX_OUTPUT_TOKENS, 256, 8_000),
  })
}

export function isAiFeature(value: unknown): value is AiFeature {
  return typeof value === 'string' && AI_FEATURES.includes(value as AiFeature)
}
