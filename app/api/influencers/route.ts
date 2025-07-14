import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/influencers - Get all verified influencers
export async function GET(request: NextRequest) {
  try {
    const influencers = await prisma.user.findMany({
      where: {
        role: 'INFLUENCER'
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        _count: {
          select: {
            reviews: true
          }
        }
      },
      orderBy: {
        reviews: {
          _count: 'desc'
        }
      }
    })

    return NextResponse.json({ influencers })
  } catch (error) {
    console.error('Get influencers error:', error)
    return NextResponse.json(
      { error: 'Failed to get influencers' },
      { status: 500 }
    )
  }
}