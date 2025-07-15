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
      console.error('JWT verification failed in admin activity:', error)
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Fetch recent activities from multiple sources
    const activities = []

    // Recent user registrations
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    recentUsers.forEach(user => {
      activities.push({
        id: `user_${user.id}`,
        type: 'user_registered',
        description: `New user registered: ${user.name}`,
        user: {
          name: user.name,
          role: user.role
        },
        createdAt: user.createdAt.toISOString()
      })
    })

    // Recent reports (with error handling)
    try {
      const recentReports = await prisma.report.findMany({
        include: {
          reporter: {
            select: {
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })

      recentReports.forEach(report => {
        activities.push({
          id: `report_${report.id}`,
          type: 'report_submitted',
          description: `Report submitted for ${report.type.toLowerCase()}: ${report.reason}`,
          user: {
            name: report.reporter.name,
            role: report.reporter.role
          },
          status: report.status.toLowerCase(),
          createdAt: report.createdAt.toISOString()
        })
      })
    } catch (reportError) {
      console.error('Error fetching recent reports:', reportError)
    }

    // Recent moderation actions (with error handling)
    try {
      const recentModerationActions = await prisma.moderationAction.findMany({
        include: {
          moderator: {
            select: {
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })

      recentModerationActions.forEach(action => {
        activities.push({
          id: `action_${action.id}`,
          type: action.type.includes('BAN') ? 'user_banned' : 'moderation_action',
          description: `Moderation action: ${action.type.replace('_', ' ').toLowerCase()} - ${action.reason || 'No reason provided'}`,
          user: {
            name: action.moderator.name,
            role: action.moderator.role
          },
          createdAt: action.createdAt.toISOString()
        })
      })
    } catch (moderationError) {
      console.error('Error fetching recent moderation actions:', moderationError)
    }

    // Recent restaurants
    const recentRestaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    recentRestaurants.forEach(restaurant => {
      activities.push({
        id: `restaurant_${restaurant.id}`,
        type: 'restaurant_added',
        description: `New restaurant added: ${restaurant.name}`,
        createdAt: restaurant.createdAt.toISOString()
      })
    })

    // Recent reviews
    const recentReviews = await prisma.review.findMany({
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        },
        restaurant: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    })

    recentReviews.forEach(review => {
      activities.push({
        id: `review_${review.id}`,
        type: 'review_posted',
        description: `New review posted for ${review.restaurant.name}`,
        user: {
          name: review.user.name,
          role: review.user.role
        },
        createdAt: review.createdAt.toISOString()
      })
    })

    // Sort all activities by date and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    return NextResponse.json({
      activities: sortedActivities
    })
  } catch (error) {
    console.error('Admin activity error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500 }
    )
  }
}