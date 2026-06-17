import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const GENERIC_REGISTER_ERROR = 'Unable to create account with those details.'

function normalizeEmail(email: unknown) {
  return typeof email === 'string' ? email.toLowerCase().trim() : ''
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''

    if (!email || !email.includes('@') || password.length < 8) {
      return NextResponse.json({ error: GENERIC_REGISTER_ERROR }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json({ error: GENERIC_REGISTER_ERROR }, { status: 400 })
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
  } catch {
    return NextResponse.json({ error: GENERIC_REGISTER_ERROR }, { status: 500 })
  }
}
