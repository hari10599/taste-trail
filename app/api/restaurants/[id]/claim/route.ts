import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'

const claimSchema = z.object({
  businessLicense: z.string().optional(),
  ownershipProof: z.string().optional(),
  taxDocument: z.string().optional(),
  additionalDocuments: z.array(z.string()).optional().default([]),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  position: z.string().min(2, 'Position must be at least 2 characters'),
  message: z.string().min(50, 'Message must be at least 50 characters')
})

// POST /api/restaurants/[id]/claim - Submit a claim for restaurant ownership
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    const userId = payload.userId
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = claimSchema.parse(body)
    
    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { 
        id: true, 
        name: true,
        ownerId: true 
      }
    })
    
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }
    
    // Check if restaurant already has an owner
    if (restaurant.ownerId) {
      // Allow dispute/reclaim if user is different from current owner
      if (restaurant.ownerId === userId) {
        return NextResponse.json(
          { error: 'You already own this restaurant' },
          { status: 400 }
        )
      }
      
      // This will be a dispute/reclaim case
      console.log(`Dispute claim initiated for restaurant ${restaurantId} by user ${userId}`)
    }
    
    // Check if user already has a pending claim for this restaurant
    const existingClaim = await prisma.restaurantClaim.findUnique({
      where: {
        userId_restaurantId: {
          userId,
          restaurantId
        }
      }
    })
    
    if (existingClaim) {
      return NextResponse.json(
        { error: `You already have a ${existingClaim.status.toLowerCase()} claim for this restaurant` },
        { status: 400 }
      )
    }
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })
    
    // Create the claim
    const isDispute = !!restaurant.ownerId
    const claim = await prisma.restaurantClaim.create({
      data: {
        userId,
        restaurantId,
        businessLicense: validatedData.businessLicense,
        ownershipProof: validatedData.ownershipProof,
        taxDocument: validatedData.taxDocument,
        additionalDocuments: validatedData.additionalDocuments,
        phoneNumber: validatedData.phoneNumber,
        email: validatedData.email,
        position: validatedData.position,
        message: validatedData.message,
        status: 'PENDING',
        isDispute
      }
    })
    
    // Send notification to all admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })
    
    // If it's a dispute, also notify the current owner
    if (isDispute && restaurant.ownerId) {
      await createNotification('restaurant_claim_dispute', restaurant.ownerId, {
        claimantName: user?.name || 'Unknown',
        restaurantName: restaurant.name,
        claimId: claim.id,
        position: validatedData.position
      })
    }
    
    for (const admin of admins) {
      await createNotification(
        isDispute ? 'restaurant_claim_dispute_admin' : 'restaurant_claim_received', 
        admin.id, 
        {
          claimantName: user?.name || 'Unknown',
          claimantEmail: user?.email || 'Unknown',
          restaurantName: restaurant.name,
          claimId: claim.id,
          position: validatedData.position,
          isDispute
        }
      )
    }
    
    return NextResponse.json({
      message: isDispute 
        ? 'Dispute claim submitted successfully. We will review your application and the existing ownership claim. Both parties will be notified of our decision.'
        : 'Claim submitted successfully. We will review your application and notify you of our decision.',
      claim: {
        id: claim.id,
        status: claim.status,
        isDispute,
        submittedAt: claim.submittedAt
      }
    })
  } catch (error: any) {
    console.error('Restaurant claim error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to submit claim' },
      { status: 500 }
    )
  }
}

// GET /api/restaurants/[id]/claim - Get user's claim status for a restaurant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: restaurantId } = await params
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ claim: null })
    }
    
    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    
    const claim = await prisma.restaurantClaim.findUnique({
      where: {
        userId_restaurantId: {
          userId: payload.userId,
          restaurantId
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatar: true
          }
        },
        restaurant: {
          select: {
            name: true
          }
        }
      }
    })
    
    return NextResponse.json({ claim })
  } catch (error) {
    console.error('Get restaurant claim error:', error)
    return NextResponse.json({ claim: null })
  }
}