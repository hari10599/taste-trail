import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

// GET /api/reviews/[id]/likes - Check if user has liked a review
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ isLiked: false })
    }
    
    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    
    const like = await prisma.like.findUnique({
      where: {
        userId_reviewId: {
          userId: payload.userId,
          reviewId: params.id,
        },
      },
    })
    
    return NextResponse.json({ isLiked: !!like })
  } catch (error) {
    console.error('Check like error:', error)
    return NextResponse.json({ isLiked: false })
  }
}