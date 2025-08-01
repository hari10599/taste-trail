import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

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
    
    if (!token) {
      return NextResponse.json(
        { error: 'Invalid authorization token format' },
        { status: 401 }
      )
    }
    
    let payload
    try {
      payload = verifyAccessToken(token)
    } catch (error) {
      console.error('JWT verification failed in admin dashboard:', error)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    // Check if user is admin or moderator
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })
    
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Calculate date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Fetch user statistics
    const [
      totalUsers,
      verifiedUsers,
      influencers,
      owners,
      newUsersThisMonth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { verified: true } }),
      prisma.user.count({ where: { role: 'INFLUENCER' } }),
      prisma.user.count({ where: { role: 'OWNER' } }),
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } }
      })
    ])

    // Fetch restaurant statistics
    const [
      totalRestaurants,
      verifiedRestaurants,
      newRestaurantsThisMonth
    ] = await Promise.all([
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { verified: true } }),
      prisma.restaurant.count({
        where: { createdAt: { gte: startOfMonth } }
      })
    ])

    // Fetch review statistics
    const [
      totalReviews,
      newReviewsThisMonth,
      avgRatingResult
    ] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      prisma.review.aggregate({
        _avg: { rating: true }
      })
    ])

    // Fetch report statistics (with error handling)
    let pendingReports = 0
    let resolvedReports = 0
    let totalReports = 0
    
    try {
      [
        pendingReports,
        resolvedReports,
        totalReports
      ] = await Promise.all([
        prisma.report.count({ where: { status: 'PENDING' } }),
        prisma.report.count({ where: { status: 'RESOLVED' } }),
        prisma.report.count()
      ])
    } catch (reportError) {
      console.error('Report statistics error:', reportError)
      // Continue with default values
    }

    // Fetch moderation statistics (with error handling)
    let moderationActionsThisMonth = 0
    let bannedUsers = 0
    let flaggedContent = 0
    
    try {
      [
        moderationActionsThisMonth,
        bannedUsers,
        flaggedContent
      ] = await Promise.all([
        prisma.moderationAction.count({
          where: { createdAt: { gte: startOfMonth } }
        }),
        prisma.moderationAction.count({
          where: {
            type: { in: ['PERMANENT_BAN', 'TEMPORARY_BAN'] },
            OR: [
              { expiresAt: null }, // Permanent bans
              { expiresAt: { gt: now } } // Active temporary bans
            ]
          }
        }),
        prisma.contentFlag.count()
      ])
    } catch (moderationError) {
      console.error('Moderation statistics error:', moderationError)
      // Continue with default values
    }

    const stats = {
      users: {
        total: totalUsers,
        verified: verifiedUsers,
        influencers: influencers,
        owners: owners,
        newThisMonth: newUsersThisMonth
      },
      restaurants: {
        total: totalRestaurants,
        verified: verifiedRestaurants,
        newThisMonth: newRestaurantsThisMonth
      },
      reviews: {
        total: totalReviews,
        newThisMonth: newReviewsThisMonth,
        averageRating: avgRatingResult._avg.rating || 0
      },
      reports: {
        pending: pendingReports,
        resolved: resolvedReports,
        total: totalReports
      },
      moderation: {
        actionsThisMonth: moderationActionsThisMonth,
        bannedUsers: bannedUsers,
        flaggedContent: flaggedContent
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}