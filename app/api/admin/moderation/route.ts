import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyAccessToken } from '@/lib/auth/jwt'

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
    
    // Check if user is admin or moderator
    const moderator = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true }
    })
    
    if (!moderator || (moderator.role !== 'ADMIN' && moderator.role !== 'MODERATOR')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { userId, action, reason, duration } = await request.json()

    if (!userId || !action || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let moderationActionType: string
    let expiresAt: Date | null = null
    let userUpdates: any = {}

    switch (action) {
      case 'ban':
        moderationActionType = 'PERMANENT_BAN'
        break
      case 'tempban':
        moderationActionType = 'TEMPORARY_BAN'
        if (duration) {
          expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000) // days to milliseconds
        }
        break
      case 'warn':
        moderationActionType = 'WARNING'
        break
      case 'promote':
        moderationActionType = 'ACCOUNT_REINSTATEMENT'
        // Only allow promotion to MODERATOR for now
        userUpdates.role = 'MODERATOR'
        break
      case 'verify':
        moderationActionType = 'ACCOUNT_REINSTATEMENT'
        userUpdates.verified = true
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Create moderation action
    const moderationAction = await prisma.moderationAction.create({
      data: {
        type: moderationActionType,
        targetId: userId,
        targetType: 'user',
        moderatorId: payload.userId,
        reason,
        expiresAt
      }
    })

    // Create user strike for warnings and bans
    if (action === 'warn' || action === 'ban' || action === 'tempban') {
      await prisma.userStrike.create({
        data: {
          userId,
          reason,
          actionId: moderationAction.id,
          expiresAt: action === 'warn' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : expiresAt // Warnings expire in 30 days
        }
      })
    }

    // Update user if needed
    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userUpdates
      })
    }

    // Create notification for the user
    await prisma.notification.create({
      data: {
        type: 'moderation_action',
        title: `Account ${action}`,
        message: `Your account has been ${action}ed. Reason: ${reason}`,
        userId: userId,
        fromId: payload.userId,
        data: {
          action,
          reason,
          moderatorId: payload.userId
        }
      }
    })

    return NextResponse.json({
      message: 'Moderation action completed',
      action: moderationAction
    })
  } catch (error) {
    console.error('Moderation action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform moderation action' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch moderation queue
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
    const type = searchParams.get('type') // 'reports', 'flags', 'appeals'

    const skip = (page - 1) * limit

    if (type === 'reports') {
      // Fetch pending reports
      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where: { status: 'PENDING' },
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.report.count({ where: { status: 'PENDING' } })
      ])

      return NextResponse.json({
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    }

    if (type === 'flags') {
      // Fetch flagged content
      const [flags, total] = await Promise.all([
        prisma.contentFlag.findMany({
          orderBy: [
            { severity: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: limit
        }),
        prisma.contentFlag.count()
      ])

      return NextResponse.json({
        flags,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    }

    // Default: return recent moderation actions
    const [actions, total] = await Promise.all([
      prisma.moderationAction.findMany({
        include: {
          moderator: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.moderationAction.count()
    ])

    return NextResponse.json({
      actions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Moderation queue error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    )
  }
}