import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { createReviewSchema } from '@/lib/validations/review'
import { createNotification } from '@/lib/notifications'

// GET /api/reviews - Get reviews with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const restaurantId = searchParams.get('restaurantId')
    const userId = searchParams.get('userId')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const filter = searchParams.get('filter') || 'all'
    
    const where: any = {
      isHidden: false,
    }
    
    // Exclude reviews with pending or investigating reports
    const reportedReviewIds = await prisma.report.findMany({
      where: {
        type: 'REVIEW',
        status: {
          in: ['PENDING', 'INVESTIGATING']
        }
      },
      select: {
        targetId: true
      }
    })
    
    const excludedIds = reportedReviewIds.map(r => r.targetId)
    
    if (excludedIds.length > 0) {
      where.id = {
        notIn: excludedIds
      }
    }
    
    if (restaurantId) {
      where.restaurantId = restaurantId
    }
    
    if (userId) {
      where.userId = userId
    }
    
    // Apply filters
    switch (filter) {
      case 'verified':
        where.user = {
          role: {
            in: ['INFLUENCER', 'OWNER', 'ADMIN', 'MODERATOR'],
          },
        }
        break
      case 'high-rated':
        where.rating = {
          gte: 4,
        }
        break
      case 'following':
        // Get current user from token if available
        const authHeader = request.headers.get('authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.split(' ')[1]
            const payload = verifyAccessToken(token)
            
            // Get users that current user is following
            const following = await prisma.follow.findMany({
              where: { followerId: payload.userId },
              select: { followingId: true }
            })
            
            const followingIds = following.map(f => f.followingId)
            
            if (followingIds.length > 0) {
              where.userId = { in: followingIds }
            } else {
              // If not following anyone, return empty results
              where.userId = { in: [] }
            }
          } catch (error) {
            // If token is invalid, just skip the filter
            console.error('Failed to verify token for following filter:', error)
          }
        }
        break
    }
    
    let reviews = await prisma.review.findMany({
      where,
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
      orderBy: sortBy === 'trending' ? { createdAt: 'desc' } : { [sortBy]: sortOrder },
      skip: sortBy === 'trending' ? 0 : (page - 1) * limit,
      take: sortBy === 'trending' ? limit * 3 : limit, // Get more for trending to sort
    })
    
    // Apply trending algorithm if sorting by trending
    if (sortBy === 'trending') {
      const now = Date.now()
      reviews = reviews.map(review => {
        const ageInHours = (now - new Date(review.createdAt).getTime()) / (1000 * 60 * 60)
        const trendingScore = (
          (review._count.likes * 0.4) +
          (review._count.comments * 0.3) +
          (0 * 0.2) + // shares - not tracked yet
          (review.rating * 0.1)
        ) / Math.pow(ageInHours + 1, 1.5)
        
        return {
          ...review,
          trendingScore,
        }
      })
      
      // Sort by trending score
      reviews.sort((a: any, b: any) => b.trendingScore - a.trendingScore)
      
      // Paginate
      reviews = reviews.slice((page - 1) * limit, page * limit)
    }
    
    const total = await prisma.review.count({ where })
    
    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: 'Failed to get reviews' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create a review
export async function POST(request: NextRequest) {
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
    
    const body = await request.json()
    
    // Extract restaurantId separately as it's not part of the form schema
    const { restaurantId, ...formData } = body
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }
    
    const validatedData = createReviewSchema.parse(formData)
    
    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })
    
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }
    
    // Check if user already reviewed this restaurant
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: payload.userId,
        restaurantId: restaurantId,
      },
    })
    
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this restaurant' },
        { status: 400 }
      )
    }
    
    // Create the review
    const review = await prisma.review.create({
      data: {
        userId: payload.userId,
        restaurantId: restaurantId,
        rating: validatedData.rating,
        title: validatedData.title,
        content: validatedData.content,
        visitDate: new Date(validatedData.visitDate),
        pricePerPerson: validatedData.pricePerPerson,
        dishes: validatedData.dishes || [],
        images: validatedData.images || [],
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
    
    // Create a notification for the restaurant owner if exists
    if (restaurant.ownerId && restaurant.ownerId !== payload.userId) {
      await createNotification('new_review', restaurant.ownerId, {
        reviewer: { name: review.user.name },
        restaurant: { name: restaurant.name },
        rating: review.rating
      }, {
        fromId: payload.userId,
        reviewId: review.id
      })
    }
    
    return NextResponse.json({ review }, { status: 201 })
  } catch (error: any) {
    console.error('Create review error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}