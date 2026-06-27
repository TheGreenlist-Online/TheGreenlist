import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  const checks = {
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    nextAuthUrlConfigured: Boolean(process.env.NEXTAUTH_URL),
    nextAuthSecretConfigured: Boolean(process.env.NEXTAUTH_SECRET),
    databaseReachable: false,
    usersTableReachable: false,
  }

  if (!checks.databaseUrlConfigured) {
    return NextResponse.json(
      {
        ok: false,
        checks,
        message: 'DATABASE_URL is missing. Add it in Vercel, run Prisma migrations, then redeploy.',
      },
      { status: 503 }
    )
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.databaseReachable = true

    await prisma.user.count()
    checks.usersTableReachable = true

    return NextResponse.json({
      ok: true,
      checks,
      message: 'Auth database checks passed.',
    })
  } catch (error) {
    console.error('Auth health check failed', error)

    return NextResponse.json(
      {
        ok: false,
        checks,
        message: 'Database is configured but auth tables are not reachable. Run prisma migrate deploy and prisma generate.',
      },
      { status: 503 }
    )
  }
}
