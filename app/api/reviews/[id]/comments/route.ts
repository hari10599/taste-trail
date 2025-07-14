import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { createNotification } from '@/lib/notifications'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1).max(500),
  parentId: z.string().optional(),
})

// GET /api/reviews/[id]/comments - Get comments for a review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comments = await prisma.comment.findMany({
      where: { 
        reviewId: id,
        parentId: null, // Only get top-level comments
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
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Failed to get comments' },
      { status: 500 }
    )
  }
}

// POST /api/reviews/[id]/comments - Create a comment
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
    
    const body = await request.json()
    const validatedData = createCommentSchema.parse(body)
    
    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id },
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
    
    // If it's a reply, check if parent comment exists
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
      })
      
      if (!parentComment || parentComment.reviewId !== id) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }
    
    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        userId: payload.userId,
        reviewId: id,
        parentId: validatedData.parentId,
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
      },
    })
    
    // Create notification for review author (if not commenting on own review)
    if (review.userId !== payload.userId) {
      await createNotification('comment', review.userId, {
        commenter: { name: comment.user.name },
        restaurant: { name: review.restaurant.name }
      }, {
        fromId: payload.userId,
        reviewId: review.id,
        commentId: comment.id
      })
    }
    
    // If this is a reply, notify the parent comment author
    if (validatedData.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: validatedData.parentId },
        select: { userId: true },
      })
      
      if (parentComment && parentComment.userId !== payload.userId) {
        await createNotification('reply', parentComment.userId, {
          replier: { name: comment.user.name }
        }, {
          fromId: payload.userId,
          reviewId: review.id,
          commentId: comment.id
        })
      }
    }
    
    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: any) {
    console.error('Create comment error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}