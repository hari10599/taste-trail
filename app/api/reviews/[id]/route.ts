import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { updateReviewSchema } from '@/lib/validations/review'

// GET /api/reviews/[id] - Get a single review
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            coverImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
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
    
    return NextResponse.json({ review })
  } catch (error) {
    console.error('Get review error:', error)
    return NextResponse.json(
      { error: 'Failed to get review' },
      { status: 500 }
    )
  }
}

// PUT /api/reviews/[id] - Update a review
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Check if review exists and belongs to user
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
    })
    
    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }
    
    if (existingReview.userId !== payload.userId && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized to edit this review' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const validatedData = updateReviewSchema.parse(body)
    
    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        visitDate: validatedData.visitDate ? new Date(validatedData.visitDate) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            coverImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })
    
    return NextResponse.json({ review: updatedReview })
  } catch (error: any) {
    console.error('Update review error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[id] - Delete a review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Check if review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })
    
    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }
    
    if (review.userId !== payload.userId && payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized to delete this review' },
        { status: 403 }
      )
    }
    
    await prisma.review.delete({
      where: { id: params.id },
    })
    
    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Delete review error:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}