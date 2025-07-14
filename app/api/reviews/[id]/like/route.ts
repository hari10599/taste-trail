import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

// POST /api/reviews/[id]/like - Like a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    
    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: id },
      include: { 
        user: true,
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    })
    
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }
    
    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_reviewId: {
          userId: payload.userId,
          reviewId: id,
        },
      },
    })
    
    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this review' },
        { status: 400 }
      )
    }
    
    // Use transaction to create like and notification
    await prisma.$transaction(async (tx) => {
      // Create like
      await tx.like.create({
        data: {
          userId: payload.userId,
          reviewId: id,
        },
      })
      
      // Create notification for review author (if not liking own review)
      if (review.userId !== payload.userId) {
        const liker = await tx.user.findUnique({
          where: { id: payload.userId },
          select: { name: true },
        })
        
        await tx.notification.create({
          data: {
            type: 'like',
            title: 'Someone liked your review',
            message: `${liker?.name} liked your review of ${review.restaurant.name}`,
            userId: review.userId,
            fromId: payload.userId,
            reviewId: review.id,
          },
        })
      }
    })
    
    // Get updated count
    const likeCount = await prisma.like.count({
      where: { reviewId: id },
    })
    
    return NextResponse.json({ 
      message: 'Review liked successfully',
      likeCount,
    })
  } catch (error) {
    console.error('Like review error:', error)
    return NextResponse.json(
      { error: 'Failed to like review' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id]/like - Unlike a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    const payload = verifyAccessToken(token)
    
    // Delete like
    await prisma.like.delete({
      where: {
        userId_reviewId: {
          userId: payload.userId,
          reviewId: id,
        },
      },
    })
    
    // Get updated count
    const likeCount = await prisma.like.count({
      where: { reviewId: id },
    })
    
    return NextResponse.json({ 
      message: 'Review unliked successfully',
      likeCount,
    })
  } catch (error: any) {
    console.error('Unlike review error:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Like not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to unlike review' },
      { status: 500 }
    )
  }
}