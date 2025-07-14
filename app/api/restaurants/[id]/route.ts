import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/restaurants/[id] - Get a single restaurant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    })
    
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }
    
    // Get average rating and recent reviews
    const [avgRating, recentReviews] = await Promise.all([
      prisma.review.aggregate({
        where: { restaurantId: restaurant.id },
        _avg: { rating: true },
      }),
      prisma.review.findMany({
        where: { restaurantId: restaurant.id },
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
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])
    
    return NextResponse.json({
      restaurant: {
        ...restaurant,
        averageRating: avgRating._avg.rating || 0,
      },
      recentReviews,
    })
  } catch (error) {
    console.error('Get restaurant error:', error)
    return NextResponse.json(
      { error: 'Failed to get restaurant' },
      { status: 500 }
    )
  }
}