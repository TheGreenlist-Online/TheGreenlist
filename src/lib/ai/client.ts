import OpenAI from 'openai'
import { getAiConfig } from './config'
import { AiError } from './errors'

/**
 * Server-only OpenAI client factory.
 *
 * The client is created per request rather than at module scope so that a
 * deployment without `OPENAI_API_KEY` still builds and boots. `OPENAI_API_KEY`
 * is read here and nowhere else in the application.
 */

function assertServerOnly() {
  if (typeof window !== 'undefined') {
    throw new AiError('internal_error', 'The OpenAI client must never be constructed in the browser.')
  }
}

/**
 * Returns `null` when AI is unconfigured or disabled, so callers can fail soft.
 */
export function getOptionalOpenAIClient(): OpenAI | null {
  assertServerOnly()

  const config = getAiConfig()
  if (!config.enabled) return null

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null

  return new OpenAI({
    apiKey,
    timeout: config.requestTimeoutMs,
    maxRetries: 1,
  })
}

/**
 * Returns a client or throws a client-safe `ai_disabled` error.
 */
export function requireOpenAIClient(): OpenAI {
  const client = getOptionalOpenAIClient()
  if (!client) {
    throw new AiError('ai_disabled', getAiConfig().disabledReason ?? 'AI features are unavailable.')
  }
  return client
}
