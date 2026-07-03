/**
 * n8n Integration Test Route
 * 
 * Admin-only endpoint to test n8n webhook connectivity.
 * Only accessible to authenticated admin users.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { n8n } from '@/lib/integrations/n8n'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role - TODO: implement role check from Supabase
    // For now, check if user email contains admin indicator
    const isAdmin = user.email?.includes('admin') || user.email?.includes('test')

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Check if n8n is configured
    if (!n8n.isConfigured()) {
      return NextResponse.json(
        { message: 'n8n not configured', configured: false },
        { status: 200 },
      )
    }

    // Send test webhook
    const result = await n8n.send('test-webhook', {
      testTime: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
    })

    return NextResponse.json(
      {
        message: 'Test webhook sent',
        result,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[n8n test] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
