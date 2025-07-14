import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value
    
    if (refreshToken) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { refreshToken },
      })
    }
    
    const response = NextResponse.json({
      message: 'Logged out successfully',
    })
    
    // Clear refresh token cookie
    response.cookies.delete('refreshToken')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}