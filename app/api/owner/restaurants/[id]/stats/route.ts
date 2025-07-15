import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

// GET /api/owner/restaurants/[id]/stats - Get restaurant statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    
    // Await params before using
    const { id } = await params
    
    // Verify restaurant ownership
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      select: { ownerId: true }
    })
    
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }
    
    // Check if user is owner or admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })
    
    if (restaurant.ownerId !== payload.userId && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Owner privileges required.' },
        { status: 403 }
      )
    }
    
    // Get total reviews count
    const totalReviews = await prisma.review.count({
      where: { restaurantId: id }
    })
    
    // Get average rating
    const avgRatingResult = await prisma.review.aggregate({
      where: { restaurantId: id },
      _avg: { rating: true }
    })
    
    // Get total likes count
    const reviewIds = await prisma.review.findMany({
      where: { restaurantId: id },
      select: { id: true }
    })
    
    const totalLikes = await prisma.like.count({
      where: {
        reviewId: { in: reviewIds.map(r => r.id) }
      }
    })
    
    // Get recent reviews
    const recentReviews = await prisma.review.findMany({
      where: { restaurantId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    // Get rating distribution
    const ratingDistribution: { [key: number]: number } = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    }
    
    const ratings = await prisma.review.groupBy({
      by: ['rating'],
      where: { restaurantId: id },
      _count: { rating: true }
    })
    
    ratings.forEach(r => {
      ratingDistribution[r.rating] = r._count.rating
    })
    
    // Get monthly review trends (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyReviews = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') as month,
        COUNT(*) as count
      FROM "Review"
      WHERE "restaurantId" = ${id}
        AND "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") DESC
    `
    
    return NextResponse.json({
      totalReviews,
      averageRating: avgRatingResult._avg.rating || 0,
      totalLikes,
      recentReviews,
      ratingDistribution,
      monthlyReviews: monthlyReviews.map(m => ({
        month: m.month,
        count: Number(m.count)
      }))
    })
  } catch (error) {
    console.error('Get restaurant stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurant statistics' },
      { status: 500 }
    )
  }
}