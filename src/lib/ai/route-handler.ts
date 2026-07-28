import { NextResponse } from 'next/server'
import type { z } from 'zod'
import type { ResponseInput } from 'openai/resources/responses/responses'
import { getAiConfig, type AiFeature } from './config'
import { AiError, logAiError, toAiError } from './errors'
import {
  createRequestId,
  estimateCostUsd,
  recordAiAudit,
  type InputClassification,
  type OutputClassification,
} from './audit'
import { assertFeatureAllowed, resolveAiPrincipal, type AiPrincipal } from './permissions'
import { enforceRateLimit } from './rate-limit'
import { runAiFeature } from './run'
import { getToolsForFeature } from './tools'

/**
 * The single entry point every AI route uses.
 *
 * Enforces, in order: feature flag → authentication → authorization →
 * request size → schema validation → rate limit → model call → output
 * validation → audit. A route that uses this cannot accidentally skip a step.
 */

/** Reject oversized bodies before parsing them. */
const MAX_BODY_BYTES = 32 * 1024

export type AiRouteDefinition<TRequest, TOutput> = Readonly<{
  feature: AiFeature
  requestSchema: z.ZodType<TRequest>
  outputSchema: z.ZodType<TOutput>
  outputSchemaName: string
  inputClassification: InputClassification
  outputClassification: OutputClassification
  /** Whether results from this feature always need a human decision. */
  humanReviewRequired: boolean
  /**
   * Build the model input. May perform additional authorization (for example
   * confirming the caller can read the requested thread) and should throw an
   * `AiError` to refuse.
   */
  buildInput: (
    input: TRequest,
    principal: AiPrincipal,
  ) => Promise<{ input: ResponseInput; records?: readonly { recordType: string; recordId: string }[] }>
}>

function errorResponse(error: AiError, requestId: string) {
  return NextResponse.json(
    {
      error: { code: error.code, message: error.message, ...error.details },
      requestId,
      aiGenerated: false,
    },
    { status: error.status, headers: { 'x-request-id': requestId } },
  )
}

async function readJsonBody(request: Request): Promise<unknown> {
  const declaredLength = Number.parseInt(request.headers.get('content-length') ?? '', 10)
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new AiError('payload_too_large', 'That request is too large.')
  }

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    throw new AiError('payload_too_large', 'That request is too large.')
  }

  try {
    return JSON.parse(raw)
  } catch {
    throw new AiError('invalid_request', 'The request body must be valid JSON.')
  }
}

export function createAiRoute<TRequest, TOutput>(definition: AiRouteDefinition<TRequest, TOutput>) {
  return async function handler(request: Request): Promise<NextResponse> {
    const requestId = createRequestId()
    const startedAt = Date.now()
    let principal: AiPrincipal | null = null

    try {
      principal = await resolveAiPrincipal()
      assertFeatureAllowed(definition.feature, principal)
      await enforceRateLimit(definition.feature, principal, request)

      const body = await readJsonBody(request)
      const parsed = definition.requestSchema.safeParse(body)
      if (!parsed.success) {
        throw new AiError('invalid_request', parsed.error.issues[0]?.message ?? 'That request is not valid.', {
          details: { issues: parsed.error.issues.map((issue) => issue.message) },
        })
      }

      const built = await definition.buildInput(parsed.data, principal)

      const result = await runAiFeature({
        feature: definition.feature,
        principal,
        input: built.input,
        outputSchema: definition.outputSchema,
        outputSchemaName: definition.outputSchemaName,
        tools: getToolsForFeature(definition.feature),
      })

      const recordsAccessed = [...(built.records ?? []), ...result.recordsAccessed]

      await recordAiAudit(principal.supabase, {
        userId: principal.user?.id ?? null,
        feature: definition.feature,
        model: result.model,
        requestId,
        inputClassification: definition.inputClassification,
        recordsAccessed,
        toolNames: result.toolNames,
        outputClassification: definition.outputClassification,
        humanReviewRequired: definition.humanReviewRequired,
        latencyMs: result.latencyMs,
        tokenUsage: result.tokenUsage,
        estimatedCostUsd: estimateCostUsd(result.model, result.tokenUsage),
        status: 'success',
        errorCode: null,
      })

      return NextResponse.json(
        {
          data: result.output,
          requestId,
          /** Clients must label this content as AI-generated wherever shown. */
          aiGenerated: true,
          humanReviewRequired: definition.humanReviewRequired,
          disclaimer:
            'AI-generated. This may be incomplete or wrong. Verify against the linked platform records before relying on it.',
        },
        { headers: { 'x-request-id': requestId, 'cache-control': 'no-store' } },
      )
    } catch (error) {
      const aiError = toAiError(error)
      logAiError(definition.feature, requestId, aiError)

      if (principal) {
        const auditStatus =
          aiError.code === 'rate_limited'
            ? 'rate_limited'
            : aiError.code === 'ai_disabled'
              ? 'disabled'
              : aiError.code === 'forbidden' || aiError.code === 'unauthenticated'
                ? 'refused'
                : 'error'

        await recordAiAudit(principal.supabase, {
          userId: principal.user?.id ?? null,
          feature: definition.feature,
          model: getAiConfig().model,
          requestId,
          inputClassification: definition.inputClassification,
          recordsAccessed: [],
          toolNames: [],
          outputClassification: definition.outputClassification,
          humanReviewRequired: definition.humanReviewRequired,
          latencyMs: Date.now() - startedAt,
          tokenUsage: null,
          estimatedCostUsd: null,
          status: auditStatus,
          errorCode: aiError.code,
        })
      }

      return errorResponse(aiError, requestId)
    }
  }
}

/**
 * Shared `GET` for AI routes: reports whether the feature is usable without
 * revealing any configuration detail beyond an on/off state.
 */
export function createAiStatusRoute(feature: AiFeature) {
  return async function handler(): Promise<NextResponse> {
    const config = getAiConfig()
    return NextResponse.json(
      {
        feature,
        enabled: config.enabled,
        reason: config.disabledReason,
      },
      { headers: { 'cache-control': 'no-store' } },
    )
  }
}
