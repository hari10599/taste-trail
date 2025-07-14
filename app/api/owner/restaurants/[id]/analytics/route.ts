import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { startOfDay, subDays, format } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const restaurantId = id

    // Check if user owns this restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
                role: true,
              },
            },
            likes: true,
            comments: true,
          },
          orderBy: {
            createdAt: 'desc',
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

    if (restaurant.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Calculate analytics
    const totalReviews = restaurant.reviews.length
    const avgRating = totalReviews > 0
      ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

    // Rating distribution
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    }
    restaurant.reviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++
    })

    // Get analytics for the last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30)
    const dailyReviews = new Map<string, number>()
    const dailyRatings = new Map<string, { sum: number; count: number }>()

    // Initialize maps for all days
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      dailyReviews.set(date, 0)
      dailyRatings.set(date, { sum: 0, count: 0 })
    }

    // Populate with actual data
    restaurant.reviews
      .filter(review => review.createdAt >= thirtyDaysAgo)
      .forEach(review => {
        const date = format(review.createdAt, 'yyyy-MM-dd')
        dailyReviews.set(date, (dailyReviews.get(date) || 0) + 1)
        
        const current = dailyRatings.get(date) || { sum: 0, count: 0 }
        dailyRatings.set(date, {
          sum: current.sum + review.rating,
          count: current.count + 1,
        })
      })

    // Convert to arrays for chart data
    const reviewTrend = Array.from(dailyReviews.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const ratingTrend = Array.from(dailyRatings.entries())
      .map(([date, data]) => ({
        date,
        rating: data.count > 0 ? data.sum / data.count : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top reviewers
    const reviewerStats = new Map<string, {
      user: any
      reviewCount: number
      avgRating: number
      totalLikes: number
    }>()

    restaurant.reviews.forEach(review => {
      const userId = review.userId
      const current = reviewerStats.get(userId) || {
        user: review.user,
        reviewCount: 0,
        avgRating: 0,
        totalLikes: 0,
      }
      
      reviewerStats.set(userId, {
        user: review.user,
        reviewCount: current.reviewCount + 1,
        avgRating: (current.avgRating * current.reviewCount + review.rating) / (current.reviewCount + 1),
        totalLikes: current.totalLikes + review.likes.length,
      })
    })

    const topReviewers = Array.from(reviewerStats.values())
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 5)

    // Recent activity
    const recentReviews = restaurant.reviews.slice(0, 5).map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content.substring(0, 100) + '...',
      user: review.user,
      createdAt: review.createdAt,
      likes: review.likes.length,
      comments: review.comments.length,
      isPromoted: review.isPromoted,
      isHidden: review.isHidden,
    }))

    // Sentiment analysis (simple version based on ratings)
    const sentiment = {
      positive: restaurant.reviews.filter(r => r.rating >= 4).length,
      neutral: restaurant.reviews.filter(r => r.rating === 3).length,
      negative: restaurant.reviews.filter(r => r.rating <= 2).length,
    }

    return NextResponse.json({
      analytics: {
        overview: {
          totalReviews,
          avgRating: Math.round(avgRating * 10) / 10,
          totalLikes: restaurant.reviews.reduce((sum, r) => sum + r.likes.length, 0),
          totalComments: restaurant.reviews.reduce((sum, r) => sum + r.comments.length, 0),
        },
        ratingDistribution,
        reviewTrend,
        ratingTrend,
        topReviewers,
        recentReviews,
        sentiment,
      },
    })
  } catch (error) {
    console.error('Get restaurant analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}