import type { z } from 'zod'
import type OpenAI from 'openai'
import type { ResponseInput, ResponseInputItem } from 'openai/resources/responses/responses'
import { requireOpenAIClient } from './client'
import { getAiConfig, type AiFeature } from './config'
import { AiError, redact } from './errors'
import { getSystemPrompt } from './prompts'
import { toResponseJsonSchema } from './schemas'
import type { AccessedRecord } from './audit'
import type { AiPrincipal } from './permissions'
import { findTool, isUnavailable, toResponsesTool, type AiTool } from './tools'

/**
 * Shared orchestration for every AI feature: one Responses API call, an
 * optional bounded tool loop, then strict validation of the structured output.
 *
 * Routes never talk to the OpenAI SDK directly — they describe what they want
 * and this module enforces the timeout, tool allow-list, token cap, and output
 * contract uniformly.
 */

/** Hard ceiling on tool round-trips, so a confused model cannot loop forever. */
const MAX_TOOL_ITERATIONS = 3

export type AiRunRequest<TOutput> = Readonly<{
  feature: AiFeature
  principal: AiPrincipal
  /** Input items, already wrapped with `asUntrustedContent` where applicable. */
  input: ResponseInput
  outputSchema: z.ZodType<TOutput>
  /** Name for the JSON schema. Must match `^[a-zA-Z0-9_]+$`. */
  outputSchemaName: string
  tools?: readonly AiTool[]
  /** Reports tool activity as it happens so failed runs can still be audited accurately. */
  onProgress?: (progress: Readonly<{
    toolNames: readonly string[]
    recordsAccessed: readonly AccessedRecord[]
  }>) => void
}>

export type AiRunResult<TOutput> = Readonly<{
  output: TOutput
  model: string
  toolNames: readonly string[]
  recordsAccessed: readonly AccessedRecord[]
  tokenUsage: Readonly<{ input: number; output: number; total: number }> | null
  latencyMs: number
}>

function extractOutputText(response: OpenAI.Responses.Response): string {
  const direct = response.output_text?.trim()
  if (direct) return direct

  // Fall back to walking the output items if the SDK helper is empty.
  const parts: string[] = []
  for (const item of response.output ?? []) {
    if (item.type !== 'message') continue
    for (const content of item.content ?? []) {
      if (content.type === 'output_text') parts.push(content.text)
    }
  }
  return parts.join('').trim()
}

function collectToolCalls(response: OpenAI.Responses.Response) {
  return (response.output ?? []).filter(
    (item): item is OpenAI.Responses.ResponseFunctionToolCall => item.type === 'function_call',
  )
}

/**
 * Execute one model-requested tool call. Input is re-validated against the
 * tool's Zod schema regardless of what the model produced; a rejected call
 * returns an error payload to the model rather than aborting the request.
 */
async function runToolCall(
  feature: AiFeature,
  principal: AiPrincipal,
  call: OpenAI.Responses.ResponseFunctionToolCall,
): Promise<{ output: string; records: readonly AccessedRecord[] }> {
  const tool = findTool(feature, call.name)
  if (!tool) {
    return { output: JSON.stringify({ error: 'This tool is not available.' }), records: [] }
  }

  let rawArguments: unknown
  try {
    rawArguments = JSON.parse(call.arguments || '{}')
  } catch {
    return { output: JSON.stringify({ error: 'Arguments were not valid JSON.' }), records: [] }
  }

  const parsed = tool.inputSchema.safeParse(rawArguments)
  if (!parsed.success) {
    return {
      output: JSON.stringify({ error: 'Invalid arguments for this tool.', issues: parsed.error.issues.map((i) => i.message) }),
      records: [],
    }
  }

  try {
    const outcome = await tool.execute({ principal }, parsed.data)
    if (isUnavailable(outcome.result)) {
      return { output: JSON.stringify(outcome.result), records: [] }
    }
    return { output: JSON.stringify(outcome.result), records: outcome.records ?? [] }
  } catch (error) {
    console.error(
      `[ai:tool:${call.name}] execution failed: ${redact(error instanceof Error ? error.message : String(error))}`,
    )
    return { output: JSON.stringify({ error: 'This tool failed. Continue without it.' }), records: [] }
  }
}

function isTimeoutError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const candidate = error as { name?: string; status?: number; code?: string }
  return candidate.name === 'APIConnectionTimeoutError' || candidate.name === 'AbortError' || candidate.code === 'ETIMEDOUT'
}

export async function runAiFeature<TOutput>(request: AiRunRequest<TOutput>): Promise<AiRunResult<TOutput>> {
  const config = getAiConfig()
  const client = requireOpenAIClient()
  const startedAt = Date.now()

  const tools = request.tools ?? []
  const conversation: ResponseInput = [...request.input]
  const usedToolNames: string[] = []
  const recordsAccessed: AccessedRecord[] = []

  let inputTokens = 0
  let outputTokens = 0
  let totalTokens = 0

  const requestBody = {
    model: config.model,
    instructions: getSystemPrompt(request.feature),
    max_output_tokens: config.maxOutputTokens,
    tools: tools.map(toResponsesTool),
    text: {
      format: {
        type: 'json_schema' as const,
        name: request.outputSchemaName,
        schema: toResponseJsonSchema(request.outputSchema),
        strict: true,
      },
    },
  }

  for (let iteration = 0; iteration <= MAX_TOOL_ITERATIONS; iteration += 1) {
    let response: OpenAI.Responses.Response
    try {
      response = await client.responses.create({ ...requestBody, input: conversation })
    } catch (error) {
      if (isTimeoutError(error)) {
        throw new AiError('upstream_timeout', 'The assistant took too long to respond. Please try again.', {
          cause: error,
        })
      }
      throw new AiError('upstream_error', 'The assistant is temporarily unavailable.', { cause: error })
    }

    if (response.usage) {
      inputTokens += response.usage.input_tokens
      outputTokens += response.usage.output_tokens
      totalTokens += response.usage.total_tokens
    }

    const toolCalls = collectToolCalls(response)

    if (toolCalls.length === 0 || iteration === MAX_TOOL_ITERATIONS) {
      const text = extractOutputText(response)
      if (!text) {
        throw new AiError('invalid_model_output', 'The assistant returned an empty response.')
      }

      let parsedJson: unknown
      try {
        parsedJson = JSON.parse(text)
      } catch (error) {
        throw new AiError('invalid_model_output', 'The assistant returned malformed output.', { cause: error })
      }

      const validated = request.outputSchema.safeParse(parsedJson)
      if (!validated.success) {
        throw new AiError('invalid_model_output', 'The assistant returned output in an unexpected shape.', {
          cause: validated.error,
        })
      }

      return {
        output: validated.data,
        model: config.model,
        toolNames: usedToolNames,
        recordsAccessed,
        tokenUsage: totalTokens > 0 ? { input: inputTokens, output: outputTokens, total: totalTokens } : null,
        latencyMs: Date.now() - startedAt,
      }
    }

    for (const call of toolCalls) {
      if (!usedToolNames.includes(call.name)) usedToolNames.push(call.name)
      const { output, records } = await runToolCall(request.feature, request.principal, call)
      recordsAccessed.push(...records)
      request.onProgress?.({
        toolNames: [...usedToolNames],
        recordsAccessed: [...recordsAccessed],
      })

      conversation.push(call as ResponseInputItem)
      conversation.push({
        type: 'function_call_output',
        call_id: call.call_id,
        output,
      } satisfies ResponseInputItem)
    }
  }

  // Unreachable: the loop always returns on its final iteration.
  throw new AiError('internal_error', 'The assistant could not complete this request.')
}
