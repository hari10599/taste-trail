import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { getActiveConnections } from '@/lib/notifications'
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
    const payload = verifyAccessToken(token)
    
    // Only allow admin users to view connection info
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })
    
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const activeConnections = getActiveConnections()
    
    return NextResponse.json({
      activeConnections,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug connections check error:', error)
    return NextResponse.json(
      { error: 'Failed to check connections' },
      { status: 500 }
    )
  }
}