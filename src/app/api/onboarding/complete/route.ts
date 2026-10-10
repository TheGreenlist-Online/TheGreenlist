import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Records the onboarding declarations for the signed-in user.
 *
 * Everything is written by the complete_onboarding() RPC, which runs as the
 * caller, sets attestation and acknowledgement once, and stamps completion
 * only when all three declarations are present. The route is a thin
 * validator; it never touches profiles.role.
 */

const schema = z.object({
  participation: z.enum(['consumer', 'professional', 'business']).optional(),
  attestAge: z.boolean().optional(),
  acknowledgeStandards: z.boolean().optional(),
})

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid onboarding payload' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('complete_onboarding', {
    p_participation: parsed.data.participation ?? null,
    p_attest_age: parsed.data.attestAge ?? false,
    p_acknowledge_standards: parsed.data.acknowledgeStandards ?? false,
  })

  if (error) {
    console.error('[onboarding] complete failed:', error.message)
    return NextResponse.json({ error: 'Could not save your answers. Please try again.' }, { status: 500 })
  }

  const row = Array.isArray(data) ? data[0] : data
  return NextResponse.json({
    participation: row?.participation ?? null,
    ageAttested: Boolean(row?.age_attested_at),
    standardsAcknowledged: Boolean(row?.standards_acknowledged_at),
    completed: Boolean(row?.onboarding_completed_at),
  })
}
