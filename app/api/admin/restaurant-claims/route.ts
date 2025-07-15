import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { createNotification } from '@/lib/notifications'

// GET /api/admin/restaurant-claims - Get all restaurant claims
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
    
    // Check if user is admin
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
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    
    const [claims, total] = await Promise.all([
      prisma.restaurantClaim.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.restaurantClaim.count({ where })
    ])
    
    return NextResponse.json({
      claims,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Get restaurant claims error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/restaurant-claims - Review a restaurant claim
export async function PUT(request: NextRequest) {
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
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true, name: true }
    })
    
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { claimId, status, reviewerNotes } = body
    
    if (!claimId || !status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }
    
    // Get the claim with restaurant and user info
    const claim = await prisma.restaurantClaim.findUnique({
      where: { id: claimId },
      include: {
        user: true,
        restaurant: true
      }
    })
    
    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }
    
    if (claim.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Claim has already been reviewed' },
        { status: 400 }
      )
    }
    
    // Update the claim
    const updatedClaim = await prisma.restaurantClaim.update({
      where: { id: claimId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: payload.userId,
        reviewerNotes
      }
    })
    
    // If approved, update the restaurant owner
    if (status === 'APPROVED') {
      await prisma.restaurant.update({
        where: { id: claim.restaurantId },
        data: {
          ownerId: claim.userId,
          verified: true
        }
      })
      
      // Update user role to OWNER if they're not already
      if (claim.user.role === 'USER') {
        await prisma.user.update({
          where: { id: claim.userId },
          data: { role: 'OWNER' }
        })
      }
    }
    
    // Send notification to the claimant
    const notificationType = status === 'APPROVED' 
      ? 'restaurant_claim_approved' 
      : 'restaurant_claim_rejected'
    
    await createNotification(notificationType, claim.userId, {
      restaurantName: claim.restaurant.name,
      notes: reviewerNotes
    })
    
    return NextResponse.json({
      message: `Claim ${status.toLowerCase()} successfully`,
      claim: updatedClaim
    })
  } catch (error) {
    console.error('Review restaurant claim error:', error)
    return NextResponse.json(
      { error: 'Failed to review claim' },
      { status: 500 }
    )
  }
}