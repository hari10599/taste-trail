import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reviewId = reviewId
    const { content } = await request.json()

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: 'Response must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Get review with restaurant info
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        restaurant: true,
        user: {
          select: {
            id: true,
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

    // Check if user owns the restaurant
    if (review.restaurant.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if response already exists
    const existingResponse = await prisma.ownerResponse.findUnique({
      where: { reviewId },
    })

    let response
    if (existingResponse) {
      // Update existing response
      response = await prisma.ownerResponse.update({
        where: { reviewId },
        data: { content },
      })
    } else {
      // Create new response
      response = await prisma.ownerResponse.create({
        data: {
          reviewId,
          content,
        },
      })

      // Create notification for the reviewer
      await prisma.notification.create({
        data: {
          type: 'owner_response',
          title: 'Owner responded to your review',
          message: `${review.restaurant.name} responded to your review`,
          userId: review.userId,
          fromId: decoded.userId,
          reviewId,
          data: {
            restaurantId: review.restaurantId,
            restaurantName: review.restaurant.name,
          },
        },
      })
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Owner response error:', error)
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params
    const reviewId = reviewId

    const response = await prisma.ownerResponse.findUnique({
      where: { reviewId },
    })

    if (!response) {
      return NextResponse.json(
        { error: 'Response not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Get owner response error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch response' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reviewId = reviewId

    // Get review with restaurant info
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        restaurant: true,
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check if user owns the restaurant
    if (review.restaurant.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the response
    await prisma.ownerResponse.delete({
      where: { reviewId },
    })

    return NextResponse.json({ message: 'Response deleted successfully' })
  } catch (error) {
    console.error('Delete owner response error:', error)
    return NextResponse.json(
      { error: 'Failed to delete response' },
      { status: 500 }
    )
  }
}