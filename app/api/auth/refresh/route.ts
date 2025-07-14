import { NextRequest, NextResponse } from 'next/server'
import { validateSession, generateAccessToken, verifyRefreshToken } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      )
    }
    
    // Verify refresh token
    try {
      verifyRefreshToken(refreshToken)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }
    
    // Validate session
    const session = await validateSession(refreshToken)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }
    
    // Generate new access token
    const tokenPayload = {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    }
    
    const accessToken = generateAccessToken(tokenPayload)
    
    return NextResponse.json({
      accessToken,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        avatar: session.user.avatar,
      },
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    )
  }
}