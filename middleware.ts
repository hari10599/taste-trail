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

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/restaurants/new', '/reviews/new']
const adminRoutes = ['/admin']
const ownerRoutes = ['/owner']
// Routes that are always public
const publicRoutes = ['/', '/restaurants', '/timeline']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next()
  }
  
  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isOwnerRoute = ownerRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute || isAdminRoute || isOwnerRoute) {
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
    
    // Check role-based access
    if (isAdminRoute && payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    if (isOwnerRoute && !['OWNER', 'ADMIN'].includes(payload.role)) {
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