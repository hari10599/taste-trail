import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

// GET /api/notifications - Get user notifications
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
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'
    
    const skip = (page - 1) * limit
    
    const where = {
      userId: payload.userId,
      ...(unreadOnly && { read: false }),
    }
    
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          from: {
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
            },
          },
          review: {
            select: {
              id: true,
              title: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])
    
    const unreadCount = await prisma.notification.count({
      where: {
        userId: payload.userId,
        read: false,
      },
    })
    
    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/read - Mark notifications as read
export async function PUT(request: NextRequest) {
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
    
    const body = await request.json()
    const { notificationIds } = body
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: {
          userId: payload.userId,
          read: false,
        },
        data: { read: true },
      })
    } else {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: payload.userId,
        },
        data: { read: true },
      })
    }
    
    return NextResponse.json({ message: 'Notifications marked as read' })
  } catch (error) {
    console.error('Mark notifications read error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}