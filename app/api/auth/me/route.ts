import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    
    try {
      const payload = verifyAccessToken(token)
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          profile: true,
          _count: {
            select: {
              reviews: true,
              likes: true,
              comments: true,
            },
          },
        },
      })
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user
      
      return NextResponse.json({ user: userWithoutPassword })
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user data' },
      { status: 500 }
    )
  }
}