import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { cache } from '@/lib/redis'

// GET /api/timeline/stats - Get timeline statistics
export async function GET(request: NextRequest) {
  try {
    // Try to get from cache
    const cacheKey = 'timeline:stats'
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }
    
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const [
      totalReviews,
      todayReviews,
      activeUsersCount,
      avgRatingResult,
    ] = await Promise.all([
      // Total reviews
      prisma.review.count({
        where: { isHidden: false },
      }),
      
      // Today's reviews
      prisma.review.count({
        where: {
          isHidden: false,
          createdAt: {
            gte: todayStart,
          },
        },
      }),
      
      // Active users (posted in last week)
      prisma.user.count({
        where: {
          reviews: {
            some: {
              createdAt: {
                gte: lastWeek,
              },
            },
          },
        },
      }),
      
      // Average rating
      prisma.review.aggregate({
        where: { isHidden: false },
        _avg: {
          rating: true,
        },
      }),
    ])
    
    const stats = {
      totalReviews,
      todayReviews,
      activeUsers: activeUsersCount,
      avgRating: avgRatingResult._avg.rating || 0,
    }
    
    // Cache for 10 minutes
    await cache.set(cacheKey, stats, 600)
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Get timeline stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get timeline stats' },
      { status: 500 }
    )
  }
}