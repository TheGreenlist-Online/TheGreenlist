/**
 * GoHighLevel Integration Test Route
 *
 * Admin-only endpoint to test GoHighLevel workflow connectivity.
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/authz'
import { gohighlevel } from '@/lib/integrations/gohighlevel'

export async function POST() {
  try {
    const principal = await requireAdmin()
    const user = principal.user

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!principal.authorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!gohighlevel.isConfigured()) {
      return NextResponse.json(
        { message: 'GoHighLevel not configured', configured: false },
        { status: 200 },
      )
    }

    const result = await gohighlevel.send('test-webhook', {
      testTime: new Date().toISOString(),
      userId: user.id,
      inquiryType: 'admin-test',
    })

    return NextResponse.json(
      {
        message: 'GoHighLevel test webhook sent',
        result,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[gohighlevel test] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
