import type { z } from 'zod'
import type { AccessedRecord } from '../audit'
import type { AiPrincipal } from '../permissions'
import { toResponseJsonSchema } from '../schemas'

/**
 * Contract for server-side AI tools.
 *
 * Every tool must:
 *  - accept a narrow, Zod-validated input (no free-form SQL, no table names,
 *    no column lists supplied by the model);
 *  - query Supabase through the caller's session client so RLS applies;
 *  - return only the fields the model needs;
 *  - report which records it touched, for the audit trail.
 *
 * The model never receives the service-role key and can never reach a table
 * that does not have a tool written for it.
 */

export type ToolContext = Readonly<{
  principal: AiPrincipal
}>

export type ToolOutcome<TResult> = Readonly<{
  result: TResult
  /** Records read, recorded in `ai_audit_logs.records_accessed`. */
  records?: readonly AccessedRecord[]
}>

export type AiTool<TInput = unknown, TResult = unknown> = Readonly<{
  name: string
  description: string
  inputSchema: z.ZodType<TInput>
  execute: (context: ToolContext, input: TInput) => Promise<ToolOutcome<TResult>>
}>

/** Shape handed to the OpenAI Responses API `tools` array. */
export type ResponsesFunctionTool = Readonly<{
  type: 'function'
  name: string
  description: string
  parameters: Record<string, unknown>
  strict: false
}>

export function toResponsesTool(tool: AiTool): ResponsesFunctionTool {
  return {
    type: 'function',
    name: tool.name,
    description: tool.description,
    parameters: toResponseJsonSchema(tool.inputSchema),
    // Tool inputs use optional fields, which strict mode forbids. Inputs are
    // re-validated with Zod on our side regardless of what the model sends.
    strict: false,
  }
}

/**
 * Standard payload returned when a tool cannot reach its backing table.
 * The repository's migration history is known to be behind production, so a
 * missing table or column must degrade to "no data" rather than a 500.
 */
export type ToolUnavailable = Readonly<{ unavailable: true; note: string }>

export function unavailable(note: string): ToolUnavailable {
  return { unavailable: true, note }
}

export function isUnavailable(value: unknown): value is ToolUnavailable {
  return typeof value === 'object' && value !== null && (value as ToolUnavailable).unavailable === true
}
