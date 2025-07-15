import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
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
    
    const body = await request.json()
    const { type = 'welcome', message = 'This is a test notification' } = body
    
    // Create a test notification
    await createNotification(type, payload.userId, {
      userName: 'Test User',
      message: message,
      timestamp: new Date().toISOString()
    })
    
    console.log(`✅ Test notification created for user ${payload.userId} with type ${type}`)
    
    return NextResponse.json({
      success: true,
      message: 'Test notification created successfully',
      userId: payload.userId,
      type: type
    })
  } catch (error) {
    console.error('Debug notification creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create test notification' },
      { status: 500 }
    )
  }
}