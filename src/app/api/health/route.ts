import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const requiredAuthEnv = ['NEXTAUTH_URL', 'NEXTAUTH_SECRET']
  const missingAuthEnv = requiredAuthEnv.filter((key) => !process.env[key])
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
    ok: missingAuthEnv.length === 0 && database !== 'error',
    app: 'The Green List',
    auth: {
      provider: 'next-auth',
      missingEnv: missingAuthEnv,
    },
    database,
    timestamp: new Date().toISOString(),
  })
}
