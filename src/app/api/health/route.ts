import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const requiredSupabaseEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
  const missingSupabaseEnv = requiredSupabaseEnv.filter((key) => !process.env[key])
  let database: 'ok' | 'unconfigured' | 'error' = missingSupabaseEnv.length > 0 ? 'unconfigured' : 'ok'

  if (missingSupabaseEnv.length === 0) {
    try {
      const supabase = await createSupabaseServerClient()
      const { error } = await supabase.from('profiles').select('id').limit(1)
      database = error ? 'error' : 'ok'
    } catch {
      database = 'error'
    }
  }

  return NextResponse.json({
    ok: missingSupabaseEnv.length === 0 && database !== 'error',
    app: 'The Green List',
    auth: {
      provider: 'supabase',
      missingEnv: missingSupabaseEnv,
    },
    database,
    timestamp: new Date().toISOString(),
  })
}
