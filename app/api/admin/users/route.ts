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
    const payload = verifyAccessToken(token)
    
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (role && role !== 'all') {
      where.role = role
    }

    if (status && status !== 'all') {
      switch (status) {
        case 'verified':
          where.verified = true
          break
        case 'unverified':
          where.verified = false
          break
        case 'banned':
          // Check for active bans
          where.moderationActions = {
            some: {
              type: { in: ['PERMANENT_BAN', 'TEMPORARY_BAN'] },
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } }
              ]
            }
          }
          break
      }
    }

    // Fetch users with counts
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          verified: true,
          createdAt: true,
          _count: {
            select: {
              reviews: true,
              likes: true,
              reports: {
                where: { status: 'PENDING' }
              },
              strikes: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    // Fetch moderation actions separately for each user
    const userIds = users.map(u => u.id)
    const moderationActions = await prisma.moderationAction.findMany({
      where: {
        targetId: { in: userIds },
        targetType: 'user',
        type: { in: ['PERMANENT_BAN', 'TEMPORARY_BAN'] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      select: {
        targetId: true,
        type: true,
        reason: true,
        expiresAt: true,
        createdAt: true
      }
    })

    // Group moderation actions by user
    const moderationActionsByUser = moderationActions.reduce((acc, action) => {
      if (!acc[action.targetId]) {
        acc[action.targetId] = []
      }
      acc[action.targetId].push(action)
      return acc
    }, {} as Record<string, typeof moderationActions>)

    // Add moderation actions to users
    const usersWithModerationActions = users.map(user => ({
      ...user,
      moderationActions: moderationActionsByUser[user.id] ? [moderationActionsByUser[user.id][0]] : []
    }))

    return NextResponse.json({
      users: usersWithModerationActions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}