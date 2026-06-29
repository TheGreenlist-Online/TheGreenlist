import { NextResponse } from 'next/server'

const movedMessage = 'Registration has moved to Supabase Auth. Use /auth/register.'

export async function GET() {
  return NextResponse.json({ error: movedMessage }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({ error: movedMessage }, { status: 410 })
}
