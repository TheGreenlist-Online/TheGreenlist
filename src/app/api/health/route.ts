import { NextResponse } from 'next/server'
import { prisma, getDatabaseUrl } from '@/lib/prisma'

export async function GET() {
  const requiredSupabaseEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
  const missingSupabaseEnv = requiredSupabaseEnv.filter((key) => !process.env[key])
  const databaseUrl = getDatabaseUrl()
  let database: 'ok' | 'unconfigured' | 'error' = databaseUrl ? 'ok' : 'unconfigured'

  if (databaseUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`
      database = 'ok'
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
