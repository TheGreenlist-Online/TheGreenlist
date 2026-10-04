/**
 * Entitlement helpers for the free tier.
 *
 * The database is the authority (see docs/entitlements-spec.md §6). These
 * helpers only (1) call the RPCs, (2) translate trigger errors raised by
 * direct inserts into the HTTP contract, and (3) build the X-Entitlement-*
 * headers the client uses to update its counters.
 *
 * Nothing here knows about plans, prices, or payment. When a commercial
 * schema exists, `public.current_plan()` changes in SQL and this file does not.
 */

import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export type EntitlementKey =
  | 'threads.new'
  | 'replies.hour'
  | 'replies.day'
  | 'ai.queries.month'
  | 'ai.queries.day'

export interface EntitlementState {
  allowed: boolean
  used: number
  max_value: number
  resets_at: string
  reason: string
}

export interface AiConsumeResult extends EntitlementState {
  /** Which window was evaluated last: the denied one, or the monthly one on success. */
  limit_key: 'ai.queries.day' | 'ai.queries.month'
  event_id: string | null
}

/** Reasons that mean "fix your account", not "you hit a limit". */
const ACCOUNT_REASONS = new Set(['age_attestation_required', 'account_restricted', 'profile_not_found'])

export function entitlementHeaders(key: EntitlementKey, state: Pick<EntitlementState, 'used' | 'max_value' | 'resets_at'>) {
  const resetsAt = new Date(state.resets_at)
  const retryAfter = Math.max(1, Math.ceil((resetsAt.getTime() - Date.now()) / 1000))
  return {
    'Retry-After': String(retryAfter),
    'X-Entitlement-Key': key,
    'X-Entitlement-Used': String(state.used),
    'X-Entitlement-Limit': String(state.max_value),
    'X-Entitlement-Resets-At': resetsAt.toISOString(),
  }
}

/** 429 for limits, 403 for account gates. Never 402: nothing is for sale. */
export function entitlementDeniedResponse(key: EntitlementKey, state: EntitlementState) {
  if (ACCOUNT_REASONS.has(state.reason)) {
    return NextResponse.json({ error: state.reason, key }, { status: 403 })
  }
  const headers = entitlementHeaders(key, state)
  return NextResponse.json(
    {
      error: 'limit_reached',
      key,
      used: state.used,
      limit: state.max_value,
      resetsAt: headers['X-Entitlement-Resets-At'],
    },
    { status: 429, headers },
  )
}

export async function checkEntitlement(
  supabase: SupabaseClient,
  profileId: string,
  key: EntitlementKey,
): Promise<EntitlementState> {
  const { data, error } = await supabase.rpc('check_entitlement', { p_profile: profileId, p_key: key })
  if (error) throw error
  const row = (Array.isArray(data) ? data[0] : data) as EntitlementState | undefined
  if (!row) throw new Error('check_entitlement returned no row')
  return row
}

export async function consumeAiQuery(
  supabase: SupabaseClient,
  model: string,
  promptChars: number,
  requestId: string,
): Promise<AiConsumeResult> {
  const { data, error } = await supabase.rpc('consume_ai_query', {
    p_model: model,
    p_prompt_chars: promptChars,
    p_request_id: requestId,
  })
  if (error) throw error
  const row = (Array.isArray(data) ? data[0] : data) as AiConsumeResult | undefined
  if (!row) throw new Error('consume_ai_query returned no row')
  return row
}

export async function refundAiQuery(supabase: SupabaseClient, eventId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('refund_ai_query', { p_event_id: eventId })
  if (error) {
    console.error('[entitlements] refund failed:', error.message)
    return false
  }
  return Boolean(data)
}

/**
 * Triggers raise `entitlement_denied:<key>:<reason>` with a hint of
 * `used=N limit=N resets_at=<ts>`. Parse that back into the HTTP contract so
 * a bypassed route still answers correctly.
 */
export function parseTriggerDenial(error: unknown): { key: EntitlementKey; state: EntitlementState } | null {
  const message = typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : ''
  const hint = typeof error === 'object' && error && 'hint' in error ? String((error as { hint: unknown }).hint ?? '') : ''
  const match = /entitlement_denied:([a-z.]+):([a-z_]+)/.exec(message)
  if (!match) return null

  const used = /used=(\d+)/.exec(hint)?.[1]
  const limit = /limit=(\d+)/.exec(hint)?.[1]
  const resets = /resets_at=(\S+)/.exec(hint)?.[1]

  return {
    key: match[1] as EntitlementKey,
    state: {
      allowed: false,
      reason: match[2],
      used: used ? Number(used) : 0,
      max_value: limit ? Number(limit) : 0,
      resets_at: resets && !Number.isNaN(Date.parse(resets)) ? resets : new Date().toISOString(),
    },
  }
}
