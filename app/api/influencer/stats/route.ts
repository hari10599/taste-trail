import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

// GET /api/influencer/stats - Get influencer statistics
export async function GET(request: NextRequest) {
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
    
    // Verify influencer status
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })
    
    if (user?.role !== 'INFLUENCER') {
      return NextResponse.json(
        { error: 'Influencer access required' },
        { status: 403 }
      )
    }
    
    // Get total reviews count
    const totalReviews = await prisma.review.count({
      where: { userId: payload.userId }
    })
    
    // Get average rating
    const avgRatingResult = await prisma.review.aggregate({
      where: { userId: payload.userId },
      _avg: { rating: true }
    })
    
    // Get total likes
    const userReviews = await prisma.review.findMany({
      where: { userId: payload.userId },
      select: { id: true }
    })
    
    const totalLikes = await prisma.like.count({
      where: {
        reviewId: { in: userReviews.map(r => r.id) }
      }
    })
    
    // Calculate engagement rate (likes per review)
    const engagementRate = totalReviews > 0 
      ? Math.round((totalLikes / totalReviews) * 100) / 100
      : 0
    
    // Get recent reviews with counts
    const recentReviews = await prisma.review.findMany({
      where: { userId: payload.userId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    // Get top performing reviews (by likes)
    const topReviews = await prisma.review.findMany({
      where: { userId: payload.userId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: {
        likes: {
          _count: 'desc'
        }
      },
      take: 5
    })
    
    // Get monthly stats (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyReviews = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as month,
        COUNT(*) as count
      FROM "Review"
      WHERE "userId" = ${payload.userId}
        AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") DESC
      LIMIT 6
    `
    
    // Get likes per month
    const monthlyLikes = await prisma.$queryRaw<Array<{ month: string; likes: bigint }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', r."createdAt"), 'Mon YYYY') as month,
        COUNT(l.id) as likes
      FROM "Review" r
      LEFT JOIN "Like" l ON l."reviewId" = r.id
      WHERE r."userId" = ${payload.userId}
        AND r."createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', r."createdAt")
      ORDER BY DATE_TRUNC('month', r."createdAt") DESC
      LIMIT 6
    `
    
    // Combine monthly stats
    const monthlyStatsMap = new Map<string, { reviews: number; likes: number }>()
    
    monthlyReviews.forEach(m => {
      monthlyStatsMap.set(m.month, { 
        reviews: Number(m.count), 
        likes: 0 
      })
    })
    
    monthlyLikes.forEach(m => {
      const existing = monthlyStatsMap.get(m.month)
      if (existing) {
        existing.likes = Number(m.likes)
      }
    })
    
    const monthlyStats = Array.from(monthlyStatsMap.entries()).map(([month, stats]) => ({
      month,
      reviews: stats.reviews,
      likes: stats.likes
    }))
    
    // Get category distribution
    const categoryStats = await prisma.$queryRaw<Array<{ category: string; count: bigint }>>`
      SELECT 
        UNNEST(res.categories) as category,
        COUNT(DISTINCT r.id) as count
      FROM "Review" r
      JOIN "Restaurant" res ON res.id = r."restaurantId"
      WHERE r."userId" = ${payload.userId}
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `
    
    const categoryDistribution = categoryStats.map(c => ({
      category: c.category,
      count: Number(c.count)
    }))
    
    // Calculate total views (placeholder - you might want to implement view tracking)
    const totalViews = totalLikes * 3 // Approximation
    
    return NextResponse.json({
      totalReviews,
      averageRating: avgRatingResult._avg.rating || 0,
      totalLikes,
      totalViews,
      engagementRate: Math.round(engagementRate * 100),
      recentReviews,
      topReviews,
      monthlyStats,
      categoryDistribution
    })
  } catch (error) {
    console.error('Get influencer stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch influencer statistics' },
      { status: 500 }
    )
  }
}