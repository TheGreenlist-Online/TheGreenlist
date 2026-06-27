import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

function normalizeEmail(email: unknown) {
  return typeof email === 'string' ? email.toLowerCase().trim() : ''
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database is not configured. Set DATABASE_URL and run Prisma migrations.' },
        { status: 503 }
      )
    }

    if (!isValidEmail(email)) {
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
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Registration failed', error)

    return NextResponse.json(
      { error: 'Unable to create account right now. Confirm DATABASE_URL is set and migrations have been deployed.' },
      { status: 500 }
    )
  }
}
