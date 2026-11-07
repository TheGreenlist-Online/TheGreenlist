/**
 * Error taxonomy for AI endpoints.
 *
 * Every failure surfaced to a client goes through `AiError` so that upstream
 * details (OpenAI messages, Postgres errors, stack traces) can never leak into
 * an HTTP response. The `cause` is kept for server-side logging only.
 */

export type AiErrorCode =
  | 'ai_disabled'
  | 'unauthenticated'
  | 'forbidden'
  | 'invalid_request'
  | 'payload_too_large'
  | 'rate_limited'
  | 'upstream_timeout'
  | 'upstream_error'
  | 'invalid_model_output'
  | 'internal_error'

const STATUS_BY_CODE: Readonly<Record<AiErrorCode, number>> = {
  ai_disabled: 503,
  unauthenticated: 401,
  forbidden: 403,
  invalid_request: 400,
  payload_too_large: 413,
  rate_limited: 429,
  upstream_timeout: 504,
  upstream_error: 502,
  invalid_model_output: 502,
  internal_error: 500,
}

export class AiError extends Error {
  readonly code: AiErrorCode
  readonly status: number
  /** Extra non-sensitive fields merged into the JSON error body. */
  readonly details: Readonly<Record<string, unknown>>
  /** Underlying error, for server-side logging only. Never serialised. */
  readonly originalError?: unknown

  constructor(
    code: AiErrorCode,
    message: string,
    options: { cause?: unknown; details?: Record<string, unknown> } = {},
  ) {
    super(message)
    this.name = 'AiError'
    this.code = code
    this.status = STATUS_BY_CODE[code]
    this.details = Object.freeze({ ...options.details })
    this.originalError = options.cause
  }
}

export function isAiError(value: unknown): value is AiError {
  return value instanceof AiError
}

/**
 * Coerce an unknown thrown value into an `AiError` with a generic message.
 * Unrecognised errors never expose their original message to the caller.
 */
export function toAiError(error: unknown): AiError {
  if (isAiError(error)) return error
  return new AiError('internal_error', 'The AI service could not complete this request.', {
    cause: error,
  })
}

/**
 * Redact anything that looks like a credential before it reaches a log sink.
 * Defence in depth — we never intentionally log secrets, but upstream SDK
 * errors have been known to echo request headers.
 */
export function redact(value: string) {
  return value
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, '[redacted-api-key]')
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted-jwt]')
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1[redacted]')
}

/**
 * Structured server-side log for an AI failure. Deliberately logs the code and
 * a redacted message only — never the request body or the model input.
 */
export function logAiError(feature: string, requestId: string, error: unknown) {
  const aiError = toAiError(error)
  const cause = aiError.originalError
  const causeMessage = cause instanceof Error ? cause.message : cause ? String(cause) : ''

  console.error(
    `[ai:${feature}] ${aiError.code} request=${requestId} ${redact(aiError.message)}` +
      (causeMessage ? ` cause=${redact(causeMessage)}` : ''),
  )
}
