import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * The signed-in user's participation limits, for the desk.
 *
 * Reads my_entitlements() from migration 20261003180000. Before that migration
 * is applied the RPC does not exist (42883) and the panel is simply not shown.
 * Nothing here is a trust signal; it is the same information the composer
 * shows ("1 of 2 remaining, resets Nov 1") gathered in one place.
 */

export type DeskLimit = {
  key: 'threads.new' | 'ai.queries.month' | 'ai.queries.day' | 'replies.hour' | 'replies.day'
  allowed: boolean
  used: number
  max: number
  resetsAt: string
  reason: string
}

export type DeskLimits = {
  available: boolean
  /** Account-level gate reasons surface here rather than per key. */
  gate: 'age_attestation_required' | 'account_restricted' | null
  threads: DeskLimit | null
  aiMonth: DeskLimit | null
  aiDay: DeskLimit | null
}

type Row = { limit_key: DeskLimit['key']; allowed: boolean; used: number; max_value: number; resets_at: string; reason: string }

const UNLIMITED = 2147483647

export async function getDeskLimits(supabase: SupabaseClient): Promise<DeskLimits> {
  const { data, error } = await supabase.rpc('my_entitlements')

  if (error) {
    // 42883 = undefined_function: entitlement migration not applied here yet.
    if (error.code !== '42883') console.error('[desk] my_entitlements failed:', error.message)
    return { available: false, gate: null, threads: null, aiMonth: null, aiDay: null }
  }

  const rows = (Array.isArray(data) ? data : []) as Row[]
  const byKey = new Map(rows.map((r) => [r.limit_key, r]))

  const toLimit = (r: Row | undefined): DeskLimit | null =>
    r ? { key: r.limit_key, allowed: r.allowed, used: r.used, max: r.max_value, resetsAt: r.resets_at, reason: r.reason } : null

  const any = rows[0]
  const gate =
    any && (any.reason === 'age_attestation_required' || any.reason === 'account_restricted') ? any.reason : null

  return {
    available: true,
    gate,
    threads: toLimit(byKey.get('threads.new')),
    aiMonth: toLimit(byKey.get('ai.queries.month')),
    aiDay: toLimit(byKey.get('ai.queries.day')),
  }
}

export function isUnlimited(limit: DeskLimit | null) {
  return !limit || limit.max >= UNLIMITED
}

export function remaining(limit: DeskLimit | null) {
  if (!limit) return 0
  return Math.max(0, limit.max - limit.used)
}

export function resetLabel(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
