import { NextResponse } from 'next/server'
import { ProfileVisibility, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const REQUESTABLE_ACCOUNT_TYPES = new Set<UserRole>([
  UserRole.BUSINESS,
  UserRole.CULTIVATOR,
  UserRole.DISTRIBUTOR,
])

const PROFILE_VISIBILITY_OPTIONS = new Set<ProfileVisibility>([
  ProfileVisibility.PUBLIC,
  ProfileVisibility.PRIVATE,
  ProfileVisibility.BUSINESS_VISIBLE,
  ProfileVisibility.ADMIN_ONLY,
])

function normalizeEmail(email: unknown) {
  return typeof email === 'string' ? email.toLowerCase().trim() : ''
}

function parseProfileVisibility(value: unknown): ProfileVisibility {
  if (typeof value === 'string' && PROFILE_VISIBILITY_OPTIONS.has(value as ProfileVisibility)) {
    return value as ProfileVisibility
  }

  return ProfileVisibility.PRIVATE
}

function parseRequestedAccountType(value: unknown): UserRole | null {
  if (typeof value === 'string' && REQUESTABLE_ACCOUNT_TYPES.has(value as UserRole)) {
    return value as UserRole
  }

  return null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const profileVisibility = parseProfileVisibility(body.profileVisibility)
    const requestedAccountType = parseRequestedAccountType(body.requestedAccountType)
    const allowAnonymousReports =
      typeof body.allowAnonymousReports === 'boolean' ? body.allowAnonymousReports : true

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      return NextResponse.json({ error: 'An account already exists for that email.' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        role: UserRole.USER,
        requestedAccountType,
        profileVisibility,
        allowAnonymousReports,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unable to create account right now.' }, { status: 500 })
  }
}
