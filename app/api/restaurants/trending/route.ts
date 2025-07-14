import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { cache } from '@/lib/redis'

// GET /api/restaurants/trending - Get trending restaurants
export async function GET(request: NextRequest) {
  try {
    // Try to get from cache
    const cacheKey = 'restaurants:trending'
    const cached = await cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }
    
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    // Get restaurants with recent reviews
    const restaurants = await prisma.restaurant.findMany({
      where: {
        reviews: {
          some: {
            createdAt: {
              gte: lastWeek,
            },
            isHidden: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        coverImage: true,
        categories: true,
        _count: {
          select: {
            reviews: true,
          },
        },
        reviews: {
          where: {
            isHidden: false,
          },
          select: {
            rating: true,
            createdAt: true,
          },
        },
      },
    })
    
    // Calculate trending score and stats
    const trendingRestaurants = restaurants.map(restaurant => {
      const allReviews = restaurant.reviews
      const recentReviews = allReviews.filter(r => r.createdAt >= lastWeek)
      const previousReviews = allReviews.filter(r => r.createdAt >= twoWeeksAgo && r.createdAt < lastWeek)
      
      const avgRating = allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0
      
      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable'
      if (recentReviews.length > previousReviews.length * 1.2) {
        trend = 'up'
      } else if (recentReviews.length < previousReviews.length * 0.8) {
        trend = 'down'
      }
      
      // Calculate trending score
      const recencyScore = recentReviews.length * 2 // Weight recent reviews more
      const ratingScore = avgRating * restaurant._count.reviews * 0.1
      const trendingScore = recencyScore + ratingScore
      
      return {
        id: restaurant.id,
        name: restaurant.name,
        coverImage: restaurant.coverImage,
        categories: restaurant.categories,
        averageRating: avgRating,
        reviewCount: restaurant._count.reviews,
        recentReviews: recentReviews.length,
        trend,
        trendingScore,
      }
    })
    
    // Sort by trending score and take top 5
    trendingRestaurants.sort((a, b) => b.trendingScore - a.trendingScore)
    const topTrending = trendingRestaurants.slice(0, 5)
    
    const response = {
      restaurants: topTrending,
    }
    
    // Cache for 30 minutes
    await cache.set(cacheKey, response, 1800)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Get trending restaurants error:', error)
    return NextResponse.json(
      { error: 'Failed to get trending restaurants' },
      { status: 500 }
    )
  }
}