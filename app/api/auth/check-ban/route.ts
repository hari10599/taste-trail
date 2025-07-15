import { NextRequest, NextResponse } from 'next/server'
import { checkUserBan } from '@/lib/auth/ban-check'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    
    const activeBan = await checkUserBan(userId)
    
    return NextResponse.json({
      isBanned: !!activeBan,
      ban: activeBan ? {
        type: activeBan.type,
        reason: activeBan.reason,
        expiresAt: activeBan.expiresAt
      } : null
    })
  } catch (error) {
    console.error('Ban check error:', error)
    return NextResponse.json({ error: 'Failed to check ban status' }, { status: 500 })
  }
}