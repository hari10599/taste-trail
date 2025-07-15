import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple JWT decode function for Edge Runtime (without verification)
function decodeJWT(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(atob(parts[1]))
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null
    }
    
    return payload
  } catch {
    return null
  }
}

// Check if user is banned (Edge Runtime compatible)
async function checkUserBanStatus(userId: string): Promise<boolean> {
  try {
    // In Edge Runtime, we need to make an API call to check ban status
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/check-ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    
    if (!response.ok) return false
    
    const data = await response.json()
    return data.isBanned || false
  } catch {
    // If we can't check, allow access (fail open)
    return false
  }
}

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/restaurants/new', '/reviews/new', '/influencer/apply']
const adminRoutes = ['/admin']
const ownerRoutes = ['/owner']
const influencerRoutes = ['/influencer']
// Routes that are always public
const publicRoutes = ['/', '/restaurants', '/timeline']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for login/register pages and ban check API
  if (pathname === '/login' || pathname === '/register' || pathname === '/api/auth/check-ban') {
    return NextResponse.next()
  }
  
  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isOwnerRoute = ownerRoutes.some(route => pathname.startsWith(route))
  const isInfluencerRoute = influencerRoutes.some(route => pathname.startsWith(route)) && !pathname.startsWith('/influencer/apply')
  
  if (isProtectedRoute || isAdminRoute || isOwnerRoute || isInfluencerRoute) {
    const authHeader = request.headers.get('authorization')
    const token = request.cookies.get('accessToken')?.value || 
                  (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null)
    
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    const payload = decodeJWT(token)
    
    if (!payload) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Check if user is banned
    const isBanned = await checkUserBanStatus(payload.userId)
    if (isBanned) {
      // Clear auth cookies and redirect to login with error
      const response = NextResponse.redirect(new URL('/login?error=banned', request.url))
      response.cookies.delete('accessToken')
      response.cookies.delete('refreshToken')
      return response
    }
    
    // Check role-based access
    if (isAdminRoute && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    if (isOwnerRoute && !['OWNER', 'ADMIN'].includes(payload.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    if (isInfluencerRoute && !['INFLUENCER', 'ADMIN'].includes(payload.role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-role', payload.role)
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - login and register pages
     * - api/debug (debug endpoints)
     */
    '/((?!api/auth|api/debug|_next/static|_next/image|favicon.ico|public|login|register).*)',
  ],
}