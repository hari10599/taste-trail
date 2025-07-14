import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an owner
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user || (user.role !== 'OWNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get restaurants owned by this user
    const restaurants = await prisma.restaurant.findMany({
      where: {
        ownerId: decoded.userId,
      },
      include: {
        _count: {
          select: {
            reviews: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    })

    // Calculate average ratings
    const restaurantsWithStats = restaurants.map(restaurant => {
      const avgRating = restaurant.reviews.length > 0
        ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / restaurant.reviews.length
        : 0

      const { reviews, ...rest } = restaurant
      return {
        ...rest,
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: restaurant._count.reviews,
      }
    })

    return NextResponse.json({ restaurants: restaurantsWithStats })
  } catch (error) {
    console.error('Get owner restaurants error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    )
  }
}

// Claim a restaurant as owner
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { restaurantId } = await request.json()

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      )
    }

    // Check if restaurant exists and isn't already claimed
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    if (restaurant.ownerId) {
      return NextResponse.json(
        { error: 'Restaurant is already claimed' },
        { status: 400 }
      )
    }

    // Update user role to OWNER if not already
    const [updatedUser, updatedRestaurant] = await prisma.$transaction([
      prisma.user.update({
        where: { id: decoded.userId },
        data: {
          role: {
            set: 'OWNER'
          }
        },
      }),
      prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          ownerId: decoded.userId,
          verified: true,
        },
      }),
    ])

    return NextResponse.json({
      message: 'Restaurant claimed successfully',
      restaurant: updatedRestaurant,
    })
  } catch (error) {
    console.error('Claim restaurant error:', error)
    return NextResponse.json(
      { error: 'Failed to claim restaurant' },
      { status: 500 }
    )
  }
}