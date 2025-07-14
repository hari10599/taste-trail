import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('accessToken')?.value
    
    return NextResponse.json({
      authHeader,
      cookieToken,
      hasAuthHeader: !!authHeader,
      hasCookieToken: !!cookieToken,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Debug error', details: error },
      { status: 500 }
    )
  }
}