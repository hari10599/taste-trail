import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db/prisma'
import { loginSchema } from '@/lib/auth/validation'
import { generateAccessToken, generateRefreshToken, createSession } from '@/lib/auth/jwt'
import { sendWelcomeNotification } from '@/lib/notifications'
import { checkUserBan } from '@/lib/auth/ban-check'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = loginSchema.parse(body)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: { profile: true },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is banned
    const activeBan = await checkUserBan(user.id)
    if (activeBan) {
      const banType = activeBan.type === 'PERMANENT_BAN' ? 'permanently banned' : 'temporarily banned'
      const expiryInfo = activeBan.expiresAt ? ` until ${activeBan.expiresAt.toLocaleDateString()}` : ''
      
      return NextResponse.json(
        { 
          error: `Your account has been ${banType}${expiryInfo}. Reason: ${activeBan.reason}`,
          banInfo: {
            type: activeBan.type,
            reason: activeBan.reason,
            expiresAt: activeBan.expiresAt,
            moderator: activeBan.moderator.name
          }
        },
        { status: 403 }
      )
    }
    
    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }
    
    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)
    
    console.log('Login successful for:', user.email, 'Role:', user.role)
    
    // Create session
    await createSession(user.id, refreshToken)
    
    // Get unread notification count
    const unreadNotificationCount = await prisma.notification.count({
      where: { 
        userId: user.id, 
        read: false 
      }
    })

    // Send welcome notification for returning users (not too frequent)
    await sendWelcomeNotification(user.id, user.name, true)
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = user
    
    const response = NextResponse.json({
      user: userWithoutPassword,
      accessToken,
      unreadNotificationCount,
    })
    
    // Set access token as cookie for middleware
    response.cookies.set('accessToken', accessToken, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes (same as JWT expiry)
    })
    
    // Set refresh token as httpOnly cookie
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })
    
    return response
  } catch (error: any) {
    console.error('Login error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}