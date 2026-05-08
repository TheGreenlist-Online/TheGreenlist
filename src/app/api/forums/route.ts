import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const forums = await prisma.forum.findMany({
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const forumsWithStats = forums.map(forum => ({
      ...forum,
      postCount: forum._count.posts,
      memberCount: 0, // TODO: implement member count
      lastActivity: forum.updatedAt
    }))

    return NextResponse.json(forumsWithStats)
  } catch (error) {
    console.error('Error fetching forums:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, slug, category, color } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    const forum = await prisma.forum.create({
      data: {
        name,
        description,
        slug,
        category,
        color,
      }
    })

    return NextResponse.json(forum, { status: 201 })
  } catch (error) {
    console.error('Error creating forum:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}