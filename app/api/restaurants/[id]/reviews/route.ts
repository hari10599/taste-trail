import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const restaurantId = id
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sort = searchParams.get('sort') || 'recent'

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

    // Build where clause - don't show hidden reviews to regular users
    let where: any = {
      restaurantId,
      isHidden: false,
    }

    // Check if user is the owner or admin to see hidden reviews
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const payload = verifyAccessToken(token)
        
        if (restaurant.ownerId === payload.userId || payload.role === 'ADMIN') {
          // Owner or admin can see all reviews
          where = { restaurantId }
        }
      } catch {
        // Invalid token, use default where clause
      }
    }

    // Build orderBy based on sort
    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'rating-high') {
      orderBy = { rating: 'desc' }
    } else if (sort === 'rating-low') {
      orderBy = { rating: 'asc' }
    } else if (sort === 'likes') {
      orderBy = {
        likes: {
          _count: 'desc',
        },
      }
    }

    // Get reviews with pagination
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ])

    // Get owner responses for all reviews
    const reviewIds = reviews.map(r => r.id)
    const ownerResponses = await prisma.ownerResponse.findMany({
      where: {
        reviewId: {
          in: reviewIds,
        },
      },
    })

    // Map owner responses to reviews
    const ownerResponseMap = new Map(
      ownerResponses.map(response => [response.reviewId, response])
    )

    // Check if current user has liked any of these reviews
    let userLikes = new Set<string>()
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1]
        const payload = verifyAccessToken(token)
        
        const likes = await prisma.like.findMany({
          where: {
            userId: payload.userId,
            reviewId: {
              in: reviewIds,
            },
          },
          select: {
            reviewId: true,
          },
        })
        
        userLikes = new Set(likes.map(l => l.reviewId))
      } catch {
        // Not logged in, ignore
      }
    }

    // Add owner responses and like status to reviews
    const reviewsWithDetails = reviews.map(review => ({
      ...review,
      ownerResponse: ownerResponseMap.get(review.id) || null,
      isLiked: userLikes.has(review.id),
    }))

    return NextResponse.json({
      reviews: reviewsWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get restaurant reviews error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}