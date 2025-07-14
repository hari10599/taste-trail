import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { sendSystemAnnouncement, getNotificationStats, getActiveConnections } from '@/lib/notifications'

// GET /api/admin/notifications - Get notification analytics
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

    // Check if user is admin/moderator
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get notification statistics
    const [
      totalNotifications,
      todayNotifications,
      yesterdayNotifications,
      weeklyNotifications,
      monthlyNotifications,
      unreadNotifications,
      notificationsByType,
      recentNotifications
    ] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({
        where: { createdAt: { gte: today } }
      }),
      prisma.notification.count({
        where: { 
          createdAt: { 
            gte: yesterday,
            lt: today
          }
        }
      }),
      prisma.notification.count({
        where: { createdAt: { gte: lastWeek } }
      }),
      prisma.notification.count({
        where: { createdAt: { gte: lastMonth } }
      }),
      prisma.notification.count({
        where: { read: false }
      }),
      prisma.notification.groupBy({
        by: ['type'],
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } }
      }),
      prisma.notification.findMany({
        where: {
          type: 'system_announcement'
        },
        include: {
          from: {
            select: {
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    // Get user statistics
    const [
      totalUsers,
      usersWithNotifications,
      avgNotificationsPerUser
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          notifications: {
            some: {}
          }
        }
      }),
      prisma.notification.aggregate({
        _avg: {
          userId: true
        }
      })
    ])

    // Active connections
    const activeConnections = getActiveConnections()

    const stats = {
      notifications: {
        total: totalNotifications,
        today: todayNotifications,
        yesterday: yesterdayNotifications,
        weekly: weeklyNotifications,
        monthly: monthlyNotifications,
        unread: unreadNotifications,
        byType: notificationsByType.reduce((acc, item) => {
          acc[item.type] = item._count.type
          return acc
        }, {} as Record<string, number>)
      },
      users: {
        total: totalUsers,
        withNotifications: usersWithNotifications,
        avgNotificationsPerUser: Math.round(totalNotifications / totalUsers)
      },
      realTime: {
        activeConnections
      },
      recent: recentNotifications
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Admin notification analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get notification analytics' },
      { status: 500 }
    )
  }
}

// POST /api/admin/notifications - Send system announcement
export async function POST(request: NextRequest) {
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true, name: true }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { title, message, userFilter } = await request.json()

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Send system announcement
    await sendSystemAnnouncement(title, message, userFilter)

    // Log the announcement
    console.log(`System announcement sent by ${user.name}: ${title}`)

    return NextResponse.json({
      message: 'System announcement sent successfully'
    })
  } catch (error) {
    console.error('Send system announcement error:', error)
    return NextResponse.json(
      { error: 'Failed to send system announcement' },
      { status: 500 }
    )
  }
}