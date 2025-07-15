import { prisma } from '@/lib/db/prisma'

export interface NotificationData {
  type: string
  title: string
  message: string
  userId: string
  fromId?: string
  reviewId?: string
  commentId?: string
  data?: any
}

export interface NotificationTemplate {
  type: string
  title: (data: any) => string
  message: (data: any) => string
}

// Active SSE connections
const connections = new Map<string, Response & { controller: ReadableStreamDefaultController }>()

// Notification templates
const templates: Record<string, NotificationTemplate> = {
  like: {
    type: 'like',
    title: () => 'Someone liked your review',
    message: (data) => `${data.liker.name} liked your review of ${data.restaurant.name}`
  },
  comment: {
    type: 'comment', 
    title: () => 'New comment on your review',
    message: (data) => `${data.commenter.name} commented on your review of ${data.restaurant.name}`
  },
  reply: {
    type: 'reply',
    title: () => 'New reply to your comment', 
    message: (data) => `${data.replier.name} replied to your comment`
  },
  new_review: {
    type: 'new_review',
    title: () => 'New review on your restaurant',
    message: (data) => `${data.reviewer.name} left a ${data.rating}-star review for ${data.restaurant.name}`
  },
  owner_response: {
    type: 'owner_response',
    title: () => 'Restaurant owner responded',
    message: (data) => `${data.restaurant.name} responded to your review`
  },
  follow: {
    type: 'follow',
    title: () => 'New follower',
    message: (data) => `${data.follower.name} started following you`
  },
  influencer_approved: {
    type: 'influencer_approved',
    title: () => 'Influencer application approved',
    message: () => 'Congratulations! Your influencer application has been approved. You now have verified influencer status.'
  },
  influencer_rejected: {
    type: 'influencer_rejected',
    title: () => 'Influencer application update',
    message: (data) => `Your influencer application has been reviewed. ${data.notes || 'Please try again later.'}`
  },
  moderation_warning: {
    type: 'moderation_warning',
    title: () => 'Content moderation warning',
    message: (data) => `You have received a warning for: ${data.reason}`
  },
  moderation_ban: {
    type: 'moderation_ban',
    title: () => 'Account suspended',
    message: (data) => `Your account has been suspended. Reason: ${data.reason}`
  },
  report_resolved: {
    type: 'report_resolved',
    title: () => 'Your report has been resolved',
    message: (data) => `The content you reported has been reviewed and action has been taken.`
  },
  system_announcement: {
    type: 'system_announcement',
    title: (data) => data.title,
    message: (data) => data.message
  },
  welcome: {
    type: 'welcome',
    title: () => 'Welcome to Taste Trail!',
    message: (data) => `Hi ${data.userName}! Welcome to Taste Trail. Start exploring restaurants and sharing your food experiences.`
  }
}

/**
 * Create a notification using templates
 */
export async function createNotification(
  templateType: string,
  userId: string,
  templateData: any = {},
  options: {
    fromId?: string
    reviewId?: string
    commentId?: string
    skipIfExists?: boolean
  } = {}
): Promise<void> {
  try {
    const template = templates[templateType]
    if (!template) {
      console.error(`Unknown notification template: ${templateType}`)
      return
    }

    // Check if notification already exists (for skipIfExists option)
    if (options.skipIfExists) {
      const existing = await prisma.notification.findFirst({
        where: {
          type: templateType,
          userId,
          fromId: options.fromId,
          reviewId: options.reviewId,
          commentId: options.commentId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
          }
        }
      })

      if (existing) {
        return // Skip creating duplicate notification
      }
    }

    const notification = await prisma.notification.create({
      data: {
        type: template.type,
        title: template.title(templateData),
        message: template.message(templateData),
        userId,
        fromId: options.fromId,
        reviewId: options.reviewId,
        commentId: options.commentId,
        data: templateData
      },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        },
        review: {
          select: {
            id: true,
            title: true,
            restaurant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        comment: {
          select: {
            id: true,
            content: true
          }
        }
      }
    })

    // Send real-time notification if user is connected
    await sendRealTimeNotification(userId, notification)

    // Check if user wants email notifications
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    })

    if (preferences?.emailEnabled) {
      // Queue email notification (implement later)
      console.log(`Email notification queued for user ${userId}`)
    }

  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}

/**
 * Send real-time notification via SSE
 */
export async function sendRealTimeNotification(userId: string, notification: any): Promise<void> {
  const connection = connections.get(userId)
  if (connection?.controller) {
    try {
      const encoder = new TextEncoder()
      const data = `data: ${JSON.stringify({
        type: 'notification',
        payload: notification
      })}\n\n`
      
      connection.controller.enqueue(encoder.encode(data))
    } catch (error) {
      console.error('Failed to send real-time notification:', error)
      // Remove broken connection
      connections.delete(userId)
    }
  }
}

/**
 * Send system announcement to all users
 */
export async function sendSystemAnnouncement(
  title: string,
  message: string,
  userFilter?: {
    roles?: string[]
    verified?: boolean
  }
): Promise<void> {
  try {
    const whereClause: any = {}
    
    if (userFilter?.roles) {
      whereClause.role = { in: userFilter.roles }
    }
    
    if (userFilter?.verified !== undefined) {
      whereClause.verified = userFilter.verified
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true }
    })

    // Create notifications in batches to avoid overwhelming the database
    const batchSize = 100
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(user => 
          createNotification('system_announcement', user.id, {
            title,
            message,
            userName: user.name
          })
        )
      )
    }

    console.log(`System announcement sent to ${users.length} users`)
  } catch (error) {
    console.error('Failed to send system announcement:', error)
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(
  userId: string,
  notificationIds?: string[]
): Promise<void> {
  try {
    const whereClause: any = { userId }
    
    if (notificationIds) {
      whereClause.id = { in: notificationIds }
    } else {
      whereClause.read = false
    }

    await prisma.notification.updateMany({
      where: whereClause,
      data: { read: true }
    })

    // Send real-time update for unread count
    const unreadCount = await prisma.notification.count({
      where: { userId, read: false }
    })

    await sendRealTimeNotification(userId, {
      type: 'unread_count_update',
      unreadCount
    })
  } catch (error) {
    console.error('Failed to mark notifications as read:', error)
  }
}

/**
 * Get user notification statistics
 */
export async function getNotificationStats(userId: string) {
  try {
    const [total, unread, byType] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } }
      })
    ])

    return {
      total,
      unread,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.type
        return acc
      }, {} as Record<string, number>)
    }
  } catch (error) {
    console.error('Failed to get notification stats:', error)
    return { total: 0, unread: 0, byType: {} }
  }
}

/**
 * Clean up old notifications (older than 30 days)
 */
export async function cleanupOldNotifications(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        read: true
      }
    })

    console.log(`Cleaned up ${result.count} old notifications`)
  } catch (error) {
    console.error('Failed to cleanup old notifications:', error)
  }
}

/**
 * Send welcome notification to new users or returning users
 */
export async function sendWelcomeNotification(userId: string, userName: string, isReturning: boolean = false): Promise<void> {
  try {
    const welcomeData = {
      userName,
      isReturning
    }

    if (isReturning) {
      // Don't send welcome notification if user has logged in recently (within 7 days)
      const recentLogin = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'welcome',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })

      if (recentLogin) {
        return // Skip welcome notification for recent users
      }
    }

    await createNotification('welcome', userId, welcomeData)
  } catch (error) {
    console.error('Failed to send welcome notification:', error)
  }
}

/**
 * SSE Connection Management
 */
export function addSSEConnection(userId: string, response: any): void {
  connections.set(userId, response)
  console.log(`SSE connection added for user ${userId}. Active connections: ${connections.size}`)
}

export function removeSSEConnection(userId: string): void {
  connections.delete(userId)
  console.log(`SSE connection removed for user ${userId}. Active connections: ${connections.size}`)
}

export function getActiveConnections(): number {
  return connections.size
}

/**
 * Send heartbeat to all connections
 */
export function sendHeartbeat(): void {
  const encoder = new TextEncoder()
  const heartbeat = encoder.encode(': heartbeat\n\n')
  
  connections.forEach((connection, userId) => {
    try {
      connection.controller?.enqueue(heartbeat)
    } catch (error) {
      console.error(`Failed to send heartbeat to user ${userId}:`, error)
      connections.delete(userId)
    }
  })
}

// Send heartbeat every 30 seconds
setInterval(sendHeartbeat, 30000)