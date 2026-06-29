import { NextResponse } from 'next/server'

const movedMessage = 'Authentication has moved to Supabase Auth. Use /auth/signin.'

export async function GET() {
  return NextResponse.json({ error: movedMessage }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: movedMessage }, { status: 410 })
}
