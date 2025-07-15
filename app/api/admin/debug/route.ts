import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'No authorization token provided',
        debug: 'Missing or invalid authorization header'
      }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    
    if (!token) {
      return NextResponse.json({
        error: 'Invalid authorization token format',
        debug: 'Token extraction failed'
      }, { status: 401 })
    }
    
    let payload
    try {
      payload = verifyAccessToken(token)
    } catch (error) {
      return NextResponse.json({
        error: 'Invalid or expired token',
        debug: `JWT verification failed: ${error instanceof Error ? error.message : error}`
      }, { status: 401 })
    }
    
    // Check user in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true }
    })
    
    if (!user) {
      return NextResponse.json({
        error: 'User not found',
        debug: `User ID ${payload.userId} not found in database`
      }, { status: 404 })
    }
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json({
        error: 'Insufficient permissions',
        debug: `User role is ${user.role}, not ADMIN`
      }, { status: 403 })
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      tokenPayload: payload,
      debug: 'Admin access verified successfully'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      debug: `Unexpected error: ${error instanceof Error ? error.message : error}`
    }, { status: 500 })
  }
}