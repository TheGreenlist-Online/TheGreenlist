import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const requiredSupabaseEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
  const missingSupabaseEnv = requiredSupabaseEnv.filter((key) => !process.env[key])
  let database: 'ok' | 'unconfigured' | 'error' = process.env.DATABASE_URL ? 'ok' : 'unconfigured'

  if (process.env.DATABASE_URL) {
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
